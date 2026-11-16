import { readAsText } from '../FilesParser/FileReader';
import type {
  PermissionDirectoryHandle,
  PermissionMode,
  Project,
} from './types';

interface Entry {
  id: string;
  data: Project;
  fileSystemDirectoryHandle?: FileSystemDirectoryHandle;
  // Absent on entries stored before it existed: they sort first.
  createdAt?: number;
}

interface FileHandle {
  write(
    dirHandle: FileSystemDirectoryHandle,
    name: string,
    data: Project,
  ): Promise<void>;
  read(dirHandle: FileSystemDirectoryHandle, name: string): Promise<Project>;
}

// The stubs call the handlers with a bare `{ target }`, so read the target, not the request.
const targetOf = <T>(event: Event) => event.target as IDBRequest<T>;

export default class IndexedDBProjectsDataSource {
  _indexedDB: IDBFactory;
  _fileHandle: FileHandle;
  _db?: IDBDatabase;
  _lastCreatedAt = 0;
  dbName: string;
  storeName: string;

  constructor(indexedDB: IDBFactory, fileHandle: FileHandle) {
    this._indexedDB = indexedDB;
    this._fileHandle = fileHandle;
    this.dbName = 'projects';
    this.storeName = 'store';
  }

  static create() {
    return new IndexedDBProjectsDataSource(indexedDB, new FileHandleWrapper());
  }

  static createNull(
    {
      projects,
      saveInError,
    }: { projects?: Project[]; saveInError?: boolean } = {
      projects: undefined,
      saveInError: false,
    },
  ) {
    const dbState: Record<string, Entry> = {};
    const fsState: Record<string, string> = {};

    for (const { dirLink, ...project } of projects ?? []) {
      dbState[project.key] = {
        id: project.key,
        data: structuredClone(project),
        fileSystemDirectoryHandle: dirLink,
      };
      if (dirLink) {
        fsState[dirLink.name] = JSON.stringify(project);
      }
    }
    return new IndexedDBProjectsDataSource(
      (saveInError
        ? new ErrorIndexedDB()
        : new StubbedIndexedDB(dbState)) as unknown as IDBFactory,
      new StubbedFileHandle(fsState),
    );
  }

  async list(): Promise<Project[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = event => {
        // getAll returns key order, and keys are random uuids.
        resolve(
          targetOf<Entry[]>(event)
            .result.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
            .map(entry => this._transform(entry)),
        );
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  async has(id: string) {
    const db = await this.open();
    return new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.count(id);
      request.onsuccess = event => {
        resolve(targetOf<number>(event).result > 0);
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  async add({ dirLink, ...data }: Project) {
    await this._add(data.key, data, dirLink);
    if (dirLink) {
      await this._fileHandle.write(dirLink, 'data.json', data);
    }
    return this.list();
  }

  async _add(
    id: string,
    data: Project,
    fileSystemDirectoryHandle?: FileSystemDirectoryHandle,
  ) {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(
        {
          id,
          fileSystemDirectoryHandle,
          data,
          createdAt: this._nextCreatedAt(),
        },
        id,
      );
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  // Strictly increasing, so projects added in the same millisecond (the migration) keep their order.
  _nextCreatedAt() {
    this._lastCreatedAt = Math.max(Date.now(), this._lastCreatedAt + 1);
    return this._lastCreatedAt;
  }

  async dirLink(id: string) {
    return (await this._get(id)).dirLink;
  }

  async get(id: string) {
    try {
      const projectDb = await this._get(id);
      if (!projectDb.dirLink) {
        return projectDb;
      }
      const projectFs = await this._fileHandle.read(
        projectDb.dirLink,
        'data.json',
      );
      projectFs.dirLink = projectDb.dirLink;
      return projectFs;
    } catch (error) {
      throw new Error(`Could not found project with id=${id}`, {
        cause: error,
      });
    }
  }

  async _get(id: string) {
    const db = await this.open();
    return new Promise<Project>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = event => {
        const result = targetOf<Entry | undefined>(event).result;
        if (result) {
          resolve(this._transform(result));
        } else {
          reject(new Error(`Could not found project with id=${id}`));
        }
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  // A copy: save() writes entry.data to data.json afterwards, and the handle must stay out of it.
  _transform(entry: Entry): Project {
    return { ...entry.data, dirLink: entry.fileSystemDirectoryHandle };
  }

  async save({ dirLink, ...data }: Project) {
    const projectDb = await this._save(data.key, data);
    if (projectDb.dirLink) {
      await this._fileHandle.write(projectDb.dirLink, 'data.json', data);
    }
    return this.list();
  }

  async _save(id: string, data: Project) {
    const db = await this.open();
    return new Promise<Project>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = event => {
        const result = targetOf<Entry>(event).result;
        const updatedData = { ...result, ...{ data: data } };
        const updateRequest = store.put(updatedData, id);
        updateRequest.onsuccess = () => {
          resolve(this._transform(updatedData));
        };
        updateRequest.onerror = event => {
          reject(targetOf(event).error);
        };
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  async delete(id: string) {
    await this._delete(id);
    return this.list();
  }

  async _delete(id: string) {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }

  async open() {
    if (this._db) {
      return this._db;
    } else {
      this._db = await this._open();
      return this._db;
    }
  }

  async _open() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = this._indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = event => {
        const db = targetOf<IDBDatabase>(event).result;
        // `keypath` is a typo for `keyPath`, so the store uses out-of-line keys: every put passes one.
        // Harmless, and fixing it needs a DB version bump.
        db.createObjectStore(this.storeName, {
          keypath: 'id',
        } as IDBObjectStoreParameters);
      };
      request.onsuccess = event => {
        resolve(targetOf<IDBDatabase>(event).result);
      };
      request.onerror = event => {
        reject(targetOf(event).error);
      };
    });
  }
}

type Handler = (event: { target: { error?: Error; result?: unknown } }) => void;

const ErrorRequest = (error: Error) =>
  new Proxy(
    {},
    {
      set: function (target, name, value: Handler, receiver) {
        if (name === 'onerror') {
          value({ target: { error: error } });
        }
        return Reflect.set(target, name, value, receiver);
      },
    },
  );

const SuccessRequest = (result: unknown) =>
  new Proxy(
    {},
    {
      set: function (target, name, value: Handler, receiver) {
        if (name === 'onsuccess') {
          value({ target: { result: result } });
        }
        return Reflect.set(target, name, value, receiver);
      },
    },
  );

// Keeps data.json as text, so values JSON can't hold are lost as they would be on disk.
class StubbedFileHandle implements FileHandle {
  store: Record<string, string>;

  constructor(fsState: Record<string, string>) {
    this.store = fsState;
  }
  async write(dirHandle: FileSystemDirectoryHandle, _: string, data: Project) {
    this.store[dirHandle.name] = JSON.stringify(data);
  }
  async read(dirHandle: FileSystemDirectoryHandle, _: string) {
    return JSON.parse(this.store[dirHandle.name]);
  }
}

class FileHandleWrapper implements FileHandle {
  async write(
    dirHandle: FileSystemDirectoryHandle,
    name: string,
    data: Project,
  ) {
    await this._checkPermission(dirHandle, 'readwrite');
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(JSON.stringify(data));
    await writableStream.close();
  }

  async read(dirHandle: FileSystemDirectoryHandle, name: string) {
    await this._checkPermission(dirHandle, 'read');
    const fileHandle = await dirHandle.getFileHandle(name);
    const file = await fileHandle.getFile();
    const result = await readAsText(file);
    return JSON.parse(result.result);
  }

  async _checkPermission(
    dirHandle: FileSystemDirectoryHandle,
    mode: PermissionMode,
  ) {
    const options = { mode: mode };
    const permission = await (
      dirHandle as PermissionDirectoryHandle
    ).requestPermission(options);
    if (permission !== 'granted') {
      throw Error(`Permission for ${dirHandle.name} was ${permission}`);
    }
  }
}

class ErrorIndexedDB {
  open() {
    return ErrorRequest(new Error('Cannot open database'));
  }
}

const cloneEntry = (entry: Entry): Entry => ({
  ...entry,
  data: structuredClone(entry.data),
});

// Clones on the way in and out, like IndexedDB's structured clone.
class StubbedIndexedDB {
  store: Record<string, Entry>;

  constructor(initialValue: Record<string, Entry>) {
    this.store = initialValue;
  }

  open() {
    return SuccessRequest(this);
  }

  transaction() {
    const dbStore = this.store;
    return {
      objectStore() {
        return {
          store: dbStore,
          get(key: string) {
            const result = this.store[key];
            if (result) {
              return SuccessRequest(cloneEntry(result));
            } else {
              return ErrorRequest(new Error(`Cannot found ${key}`));
            }
          },
          getAll() {
            const result = Object.keys(this.store)
              .sort()
              .map(key => cloneEntry(this.store[key]));
            return SuccessRequest(result);
          },
          count(key: string) {
            return SuccessRequest(key in this.store ? 1 : 0);
          },
          put(value: Entry, key: string) {
            this.store[key] = cloneEntry(value);
            return SuccessRequest(undefined);
          },
          delete(key: string) {
            if (this.store[key]) {
              delete this.store[key];
              return SuccessRequest(undefined);
            } else {
              return ErrorRequest(new Error(`Cannot found ${key}`));
            }
          },
        };
      },
    };
  }
}

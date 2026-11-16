import IndexedDBProjectsDataSource from './IndexedDBProjectsDataSource';
import type { Project } from './types';

describe('IndexedDBProjectsDataSource', () => {
  describe('create', () => {
    beforeAll(() => {
      vi.stubGlobal('indexedDB', null);
    });
    afterAll(() => {
      vi.unstubAllGlobals();
    });
    test('happy path', () => {
      expect(() => IndexedDBProjectsDataSource.create()).not.toThrow();
    });
  });

  describe('list', () => {
    test('nothing', async () => {
      await expect(
        IndexedDBProjectsDataSource.createNull().list(),
      ).resolves.toEqual([]);
    });

    test('one project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await expect(source.list()).resolves.toEqual([createProject()]);
    });

    test('follows the order projects were added, not the key order', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(keyed('b'));
      await source.add(keyed('a'));
      await source.add(keyed('c'));
      await expect(keysOf(source)).resolves.toEqual(['b', 'a', 'c']);
    });

    test('projects stored before the order existed come first, in key order', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [keyed('z'), keyed('y')],
      });
      await source.add(keyed('a'));
      await expect(keysOf(source)).resolves.toEqual(['y', 'z', 'a']);
    });

    test('saving keeps the position', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(keyed('b'));
      await source.add(keyed('a'));
      await source.save({ ...keyed('b'), name: 'renamed' });
      await expect(keysOf(source)).resolves.toEqual(['b', 'a']);
    });
  });

  describe('get', () => {
    test('returns the project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await expect(source.get('key')).resolves.toEqual(createProject());
    });

    test('fails is project not found', async () => {
      await expect(
        IndexedDBProjectsDataSource.createNull().get('key'),
      ).rejects.toThrow('Could not found project with id=key');
    });
  });

  describe('add', () => {
    test('one project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await expect(source.add(createProject())).resolves.toEqual([
        createProject(),
      ]);
    });

    test('fails on error', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        saveInError: true,
      });
      await expect(source.add(createProject({}))).rejects.toThrow();
    });

    test('leaves its input untouched', async () => {
      const project = createProject();
      await IndexedDBProjectsDataSource.createNull().add(project);
      expect(project).toEqual(createProject());
    });
  });

  describe('has', () => {
    test('true when stored', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [createProject()],
      });
      await expect(source.has('key')).resolves.toEqual(true);
    });

    test('false when missing', async () => {
      await expect(
        IndexedDBProjectsDataSource.createNull().has('key'),
      ).resolves.toEqual(false);
    });

    test('rejects when IndexedDB fails', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        saveInError: true,
      });
      await expect(source.has('key')).rejects.toThrow('Cannot open database');
    });
  });

  describe('unlinked project', () => {
    test('createNull accepts it', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [createUnlinkedProject()],
      });
      await expect(source.list()).resolves.toEqual([createUnlinkedProject()]);
    });

    test('get returns the stored project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createUnlinkedProject());
      await expect(source.get('key')).resolves.toEqual(createUnlinkedProject());
    });

    test('add and save write no folder', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      failWrites(source);
      await source.add(createUnlinkedProject());
      await source.save(createUnlinkedProject({ data: ['new'] }));
      await expect(source.get('key')).resolves.toEqual(
        createUnlinkedProject({ data: ['new'] }),
      );
    });

    test('dirLink is undefined', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [createUnlinkedProject()],
      });
      await expect(source.dirLink('key')).resolves.toEqual(undefined);
    });
  });

  describe('save', () => {
    test('one existing project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await expect(
        source.save(createProject({ data: ['new'] })),
      ).resolves.toEqual([createProject({ data: ['new'] })]);
    });

    test('fails if project does not exist', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await expect(source.save(createProject())).rejects.toThrow();
    });

    test('writes data.json', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await source.save(createProject({ data: ['new'] }));
      await expect(source.get('key')).resolves.toEqual(
        createProject({ data: ['new'] }),
      );
    });

    test('data.json holds no dirLink', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      const dirLink = createProject().dirLink!;
      await source.add(createProject());
      expect(await source._fileHandle.read(dirLink, 'data.json')).toEqual(
        createUnlinkedProject(),
      );
      await source.save(createProject({ data: ['new'] }));
      expect(await source._fileHandle.read(dirLink, 'data.json')).toEqual(
        createUnlinkedProject({ data: ['new'] }),
      );
    });

    test('when data.json cannot be written, the DB is left unchanged (B14)', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      failWrites(source);

      await expect(
        source.save(createProject({ data: ['new'] })),
      ).rejects.toThrow('Permission for dir was denied');

      await expect(source.list()).resolves.toEqual([createProject()]);
      await expect(source.get('key')).resolves.toEqual(createProject());
    });
  });

  describe('data.json edited outside the app (B15)', () => {
    test('get returns the file and list follows once it has been read', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await editOutside(
        source,
        Object.assign(createProject(), { name: 'edited' }),
      );

      const project = await source.get('key');
      expect(project.name).toEqual('edited');
      const listed = await source.list();
      expect(listed[0].name).toEqual('edited');
    });

    test('get keeps the position in the list', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await source.add(keyed('z'));
      await editOutside(
        source,
        Object.assign(createProject(), { name: 'edited' }),
      );

      await source.get('key');

      await expect(keysOf(source)).resolves.toEqual(['key', 'z']);
    });

    test('get returns the file even when the DB cannot be refreshed', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await editOutside(
        source,
        Object.assign(createProject(), { name: 'edited' }),
      );
      await failDbWrites(source);
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const project = await source.get('key');

      expect(project.name).toEqual('edited');
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('delete', () => {
    test('one existing project', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await expect(source.delete('key')).resolves.toEqual([]);
    });

    test('fails if project does not exist', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await expect(source.delete('key')).rejects.toThrow();
    });

    test('fails on error', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [createProject()],
        saveInError: true,
      });
      await expect(source.delete('key')).rejects.toThrow();
    });
  });

  describe('dirLink', () => {
    test('one existing project', async () => {
      const source = IndexedDBProjectsDataSource.createNull({
        projects: [createProject()],
      });
      await expect(source.dirLink('key')).resolves.toEqual({ name: 'dir' });
    });
    test('fails if project does not exist', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await expect(source.dirLink('key')).rejects.toThrow();
    });
  });
});

function createProject({ data }: { data?: unknown[] } = { data: [] }) {
  return {
    data: data,
    key: 'key',
    colors: {},
    dirLink: { name: 'dir' },
  } as unknown as Project;
}

function createUnlinkedProject({ data }: { data?: unknown[] } = { data: [] }) {
  const { dirLink, ...project } = createProject({ data });
  return project as Project;
}

function keyed(key: string) {
  return { ...createUnlinkedProject(), key } as Project;
}

async function keysOf(source: IndexedDBProjectsDataSource) {
  return (await source.list()).map(project => project.key);
}

function failWrites(source: IndexedDBProjectsDataSource) {
  source._fileHandle.write = async dirHandle => {
    throw Error(`Permission for ${dirHandle?.name} was denied`);
  };
}

async function editOutside(
  source: IndexedDBProjectsDataSource,
  project: Project,
) {
  const { dirLink, ...data } = project;
  await source._fileHandle.write(dirLink!, 'data.json', data);
}

async function failDbWrites(source: IndexedDBProjectsDataSource) {
  const db = await source.open();
  const transaction = db.transaction.bind(db);
  const failing = {
    set onsuccess(_: unknown) {},
    set onerror(handler: (event: unknown) => void) {
      handler({ target: { error: new Error('QuotaExceededError') } });
    },
  };
  db.transaction = ((...args: Parameters<IDBDatabase['transaction']>) => {
    const tx = transaction(...args);
    return {
      objectStore: (name: string) =>
        Object.assign(tx.objectStore(name), { put: () => failing }),
    };
  }) as unknown as IDBDatabase['transaction'];
}

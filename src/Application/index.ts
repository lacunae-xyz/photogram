import Csv from '../FilesParser/Csv';
import { readAsText } from '../FilesParser/FileReader';
import Images from '../FilesParser/Images';
import Uuidv4 from '../FilesParser/uuidv4';
import IndexedDBProjectsDataSource from './IndexedDBProjectsDataSource';
import LocalStorageMigration from './LocalStorageMigration';
import type {
  ColorDistribution,
  Colors,
  PermissionDirectoryHandle,
  Project,
  Shot,
  Template,
} from './types';
import type { ImageUrl } from '../FilesParser/Images';

const colors = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
];

// Every page builds its own Application: they share one migration so it runs once.
let migration: Promise<void> | undefined;

class Application {
  _csv: Csv;
  _dataSource: IndexedDBProjectsDataSource;
  _images: Images;
  _uuidv4: Uuidv4;
  _migration: Promise<void>;

  constructor(
    dataSource: IndexedDBProjectsDataSource,
    images: Images,
    uuidv4: Uuidv4,
    migration: Promise<void>,
  ) {
    this._csv = new Csv();
    this._dataSource = dataSource;
    this._images = images;
    this._uuidv4 = uuidv4;
    this._migration = migration;
  }

  static create() {
    migration ??= LocalStorageMigration.create(
      IndexedDBProjectsDataSource.create(),
    ).run();
    return new Application(
      IndexedDBProjectsDataSource.create(),
      Images.create(),
      Uuidv4.create(),
      migration,
    );
  }

  static createNull({
    dataSource = IndexedDBProjectsDataSource.createNull(),
    images = Images.createNull(),
    migration = Promise.resolve(),
  }: {
    dataSource?: IndexedDBProjectsDataSource;
    images?: Images;
    migration?: Promise<void>;
  } = {}) {
    return new Application(dataSource, images, Uuidv4.createNull(), migration);
  }

  /** Resolves once projects from older releases are in IndexedDB. Never rejects. */
  ready() {
    return this._migration;
  }

  async list(): Promise<Project[]> {
    await this.ready();
    return await this._dataSource.list();
  }

  async get(id: string): Promise<Project> {
    await this.ready();
    return await this._dataSource.get(id);
  }

  async requestPermission(id: string) {
    await this.ready();
    const dirHandle = (await this._dataSource.dirLink(id)) as
      PermissionDirectoryHandle | undefined;
    if (dirHandle) {
      const options = { mode: 'readwrite' } as const;
      const permission = await dirHandle.requestPermission(options);
      if (permission !== 'granted') {
        throw new Error(`Permission for ${dirHandle.name} was ${permission}`);
      }
    } else {
      throw new Error('No directory is defined');
    }
  }

  async needsPermission(id: string) {
    await this.ready();
    const dirHandle = (await this._dataSource.dirLink(id)) as
      PermissionDirectoryHandle | undefined;
    if (dirHandle) {
      const options = { mode: 'readwrite' } as const;
      const permission = await dirHandle.queryPermission(options);
      return permission === 'prompt';
    } else {
      return false;
    }
  }

  async delete(id: string): Promise<Project[]> {
    await this.ready();
    const projects = await this._dataSource.delete(id);
    await this._images.clear(id);
    return projects;
  }

  async update(id: string, data: Shot) {
    const project = await this.get(id);
    project.data = project.data.map(item => {
      if (item.id === data.id) {
        return {
          id: data.id,
          url: data.url,
          sequence: data.sequence,
          action: data.action,
          label: data.label,
          periode: data.periode,
          fx: data.fx,
        };
      } else {
        return item;
      }
    });
    if (data.label && project.colors[data.label] === undefined) {
      project.colors[data.label] =
        colors[Object.keys(project.colors).length % colors.length];
    }
    await this._dataSource.save(project);
  }

  async updateColor(id: string, colors: Colors) {
    const project = await this.get(id);
    Object.keys(colors).forEach(key => {
      project.colors[key] = colors[key];
    });
    await this._dataSource.save(project);
  }

  async updateDefaultColor(id: string, color: string) {
    const project = await this.get(id);
    project.defaultColor = color;
    await this._dataSource.save(project);
  }

  async deleteColor(id: string, key: string) {
    const project = await this.get(id);
    project.colors[key] = undefined;
    project.data = project.data.map(item => {
      if (key === item.label) {
        return Object.assign(item, {
          label: undefined,
        });
      } else {
        return item;
      }
    });
    await this._dataSource.save(project);
  }

  async updateColorDistribution(id: string, distribution: ColorDistribution) {
    const project = await this.get(id);
    project.colorDistribution = distribution;
    await this._dataSource.save(project);
  }

  async updateFontFamily(id: string, fontFamily: string) {
    const project = await this.get(id);
    project.fontFamily = fontFamily;
    await this._dataSource.save(project);
  }

  async updatePrintSpaceAround(id: string, printSpaceAround: boolean) {
    const project = await this.get(id);
    project.printSpaceAround = printSpaceAround;
    await this._dataSource.save(project);
  }

  async updateTemplate(id: string, template: Template) {
    const project = await this.get(id);
    project.template = template;
    await this._dataSource.save(project);
  }

  async updateMainPicture(id: string, mainPicture: string) {
    const project = await this.get(id);
    project.mainPicture = mainPicture;
    await this._dataSource.save(project);
  }

  /** data.json for an unlinked project: Import reads it back, edits included. */
  async exportDataJson(id: string): Promise<string> {
    const { dirLink, ...project } = await this.get(id);
    return JSON.stringify(project);
  }

  async add(files: ArrayLike<File> | Iterable<File>): Promise<Project[]> {
    // Copy before awaiting: callers reset the form, which empties a live FileList.
    const fileArray = Array.from(files);
    await this.ready();
    const exported = await this._readDataJson(fileArray);
    if (exported) {
      return await this._dataSource.add(exported);
    }
    const projects = await this._dataSource.list();
    const name = this._name(fileArray, `Project (${projects.length})`);
    const identifier = this._uuidv4.generate();
    const images = await this._images.execute(identifier, fileArray);
    const data = await this._csv.execute(fileArray);
    const project: Project = {
      key: identifier,
      name: name,
      data: this._mergeDateWithImages(data, images),
      colors: Application._calculateColors(data),
      template: 'small',
    };
    return await this._dataSource.add(project);
  }

  async open(dirHandle: FileSystemDirectoryHandle): Promise<Project[]> {
    await this.ready();
    const project = await this._parse(dirHandle);
    return await this._dataSource.add(project);
  }

  async _parse(dirHandle: FileSystemDirectoryHandle): Promise<Project> {
    const fileArray: File[] = [];
    for await (const value of dirHandle.values()) {
      if (value.kind === 'file') {
        fileArray.push(await value.getFile());
      }
    }
    const exported = await this._readDataJson(fileArray);

    if (exported) {
      exported.dirLink = dirHandle;
      return exported;
    } else {
      const identifier = this._uuidv4.generate();

      const urls = await this._images.execute(identifier, fileArray);
      const name = dirHandle.name;
      const data = await this._csv.execute(fileArray);

      const project: Project = {
        key: identifier,
        name: name,
        data: this._mergeDateWithImages(data, urls),
        colors: Application._calculateColors(data),
        template: 'small',
        dirLink: dirHandle,
      };
      if (project.data.length !== 0) {
        project.mainPicture = project.data[0].url;
      }
      return project;
    }
  }

  /** The project in data.json, with its images cached under its own key. */
  async _readDataJson(fileArray: File[]): Promise<Project | undefined> {
    const jsonData = fileArray.find(file => file.name === 'data.json');
    if (!jsonData) {
      return undefined;
    }
    const project: Project = JSON.parse((await readAsText(jsonData)).result);
    await this._images.execute(project.key, fileArray);
    return project;
  }

  _mergeDateWithImages(data: Shot[], images: ImageUrl[]) {
    return data.map(d => {
      const results = images.filter(i => i.name.startsWith(`${d.id}.`));
      if (results.length === 0) {
        return d;
      } else {
        return Object.assign(d, {
          url: results[0].url,
        });
      }
    });
  }

  static _calculateColors(data: Shot[]): Colors {
    const unique = [
      ...new Set(data.map(d => d.label).filter(p => p !== null && p !== '')),
    ] as string[];
    return Object.assign(
      {},
      ...unique.map((p, i) => ({ [p]: colors[i % colors.length] })),
    );
  }

  _name(files: File[], defaultName: string) {
    if (files.length === 0) {
      return defaultName;
    }
    const relativePath = files[0].webkitRelativePath;
    if (relativePath) {
      return relativePath.split('/')[0];
    }
    return defaultName;
  }
}

export default Application;

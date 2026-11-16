import IndexedDBProjectsDataSource from './IndexedDBProjectsDataSource';
import type { Project, Shot } from './types';

const storageKey = 'projects';

type LegacyStorage = Pick<Storage, 'getItem' | 'removeItem'>;

// Shapes written by older releases: numeric keys (2018), `place` before `label` (before 2019-06),
// no template or display settings.
type LegacyShot = Shot & { place?: string };
type LegacyProject = Omit<Partial<Project>, 'key' | 'data'> & {
  key: string | number;
  data?: LegacyShot[];
};

/** Copies the projects older releases imported into `localStorage.projects` to IndexedDB. Images stay in Cache Storage under the same key. */
export default class LocalStorageMigration {
  _localStorage: LegacyStorage;
  _dataSource: IndexedDBProjectsDataSource;

  constructor(
    localStorage: LegacyStorage,
    dataSource: IndexedDBProjectsDataSource,
  ) {
    this._localStorage = localStorage;
    this._dataSource = dataSource;
  }

  static create(dataSource: IndexedDBProjectsDataSource) {
    return new LocalStorageMigration(localStorage, dataSource);
  }

  static createNull({
    stored,
    dataSource = IndexedDBProjectsDataSource.createNull(),
  }: { stored?: string; dataSource?: IndexedDBProjectsDataSource } = {}) {
    return new LocalStorageMigration(
      new StubbedLocalStorage(stored),
      dataSource,
    );
  }

  /** Never rejects. Keeps the key unless every project is in IndexedDB, so a failure retries on the next start. */
  async run() {
    try {
      const projects = this._read();
      if (projects === undefined) {
        return;
      }
      let failed = false;
      for (const project of projects) {
        try {
          const migrated = normalise(project);
          if (!(await this._dataSource.has(migrated.key))) {
            await this._dataSource.add(migrated);
          }
        } catch (error) {
          failed = true;
          console.error(`Cannot migrate project ${project?.key}`, error);
        }
      }
      if (!failed && projects.length > 0) {
        this._localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Cannot migrate localStorage projects', error);
    }
  }

  _read(): LegacyProject[] | undefined {
    const stored = this._localStorage.getItem(storageKey);
    if (stored === null) {
      return undefined;
    }
    const projects: unknown = JSON.parse(stored);
    if (!Array.isArray(projects)) {
      throw new Error(`localStorage.${storageKey} is not an array`);
    }
    return projects;
  }
}

function normalise({ dirLink, ...project }: LegacyProject): Project {
  return {
    ...project,
    key: String(project.key),
    name: project.name ?? '',
    data: (project.data ?? []).map(normaliseShot),
    colors: project.colors ?? {},
    template: project.template ?? 'small',
    colorDistribution: project.colorDistribution ?? 'indicator',
  };
}

function normaliseShot({ place, ...shot }: LegacyShot): Shot {
  if (shot.label === undefined && place !== undefined) {
    return { ...shot, label: place };
  }
  return shot;
}

class StubbedLocalStorage implements LegacyStorage {
  store: Record<string, string>;

  constructor(stored?: string) {
    this.store = stored === undefined ? {} : { [storageKey]: stored };
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

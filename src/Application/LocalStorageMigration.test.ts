import Application from './index';
import IndexedDBProjectsDataSource from './IndexedDBProjectsDataSource';
import LocalStorageMigration from './LocalStorageMigration';
import type { Project, Shot } from './types';

describe('LocalStorageMigration', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    beforeAll(() => {
      vi.stubGlobal('indexedDB', null);
    });
    afterAll(() => {
      vi.unstubAllGlobals();
    });
    test('happy path', () => {
      expect(() =>
        LocalStorageMigration.create(IndexedDBProjectsDataSource.create()),
      ).not.toThrow();
    });
  });

  describe('nothing to do', () => {
    test('no key', async () => {
      const dataSource = IndexedDBProjectsDataSource.createNull();
      const migration = LocalStorageMigration.createNull({ dataSource });
      await migration.run();
      await expect(dataSource.list()).resolves.toEqual([]);
      expect(stored(migration)).toBeNull();
    });

    test('empty list', async () => {
      const dataSource = IndexedDBProjectsDataSource.createNull();
      const migration = LocalStorageMigration.createNull({
        stored: '[]',
        dataSource,
      });
      await migration.run();
      await expect(dataSource.list()).resolves.toEqual([]);
      expect(stored(migration)).toEqual('[]');
    });

    test('invalid JSON is logged and kept', async () => {
      const dataSource = IndexedDBProjectsDataSource.createNull();
      const migration = LocalStorageMigration.createNull({
        stored: '{ not json',
        dataSource,
      });
      await expect(migration.run()).resolves.toBeUndefined();
      await expect(dataSource.list()).resolves.toEqual([]);
      expect(stored(migration)).toEqual('{ not json');
      expect(consoleError).toHaveBeenCalled();
    });
  });

  test('one project is copied and the key removed', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const migration = createMigration([legacy('a')], dataSource);
    await migration.run();
    await expect(dataSource.list()).resolves.toEqual([legacy('a')]);
    expect(stored(migration)).toBeNull();
  });

  test('three projects are copied and the key removed', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const projects = [legacy('a'), legacy('b'), legacy('c')];
    const migration = createMigration(projects, dataSource);
    await migration.run();
    await expect(dataSource.list()).resolves.toEqual(projects);
    expect(stored(migration)).toBeNull();
  });

  test('projects keep their localStorage order', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const projects = [legacy('m'), legacy('z'), legacy('a')];
    await createMigration(projects, dataSource).run();
    await expect(dataSource.list()).resolves.toEqual(projects);
  });

  test('a project already in IndexedDB is not overwritten', async () => {
    const existing = Object.assign(legacy('a'), { name: 'Already there' });
    const dataSource = IndexedDBProjectsDataSource.createNull({
      projects: [existing],
    });
    const migration = createMigration([legacy('a'), legacy('b')], dataSource);
    await migration.run();
    await expect(dataSource.list()).resolves.toEqual([existing, legacy('b')]);
    expect(stored(migration)).toBeNull();
  });

  test('IndexedDB failing on the second project keeps the key, the next run completes', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const add = dataSource.add.bind(dataSource);
    let calls = 0;
    vi.spyOn(dataSource, 'add').mockImplementation(async project => {
      calls++;
      if (calls === 2) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return add(project);
    });
    const projects = [legacy('a'), legacy('b'), legacy('c')];
    const migration = createMigration(projects, dataSource);

    await migration.run();
    await expect(dataSource.list()).resolves.toEqual([
      legacy('a'),
      legacy('c'),
    ]);
    expect(stored(migration)).toEqual(JSON.stringify(projects));

    await migration.run();
    const keys = (await dataSource.list()).map(project => project.key);
    expect(keys.sort()).toEqual(['a', 'b', 'c']);
    expect(stored(migration)).toBeNull();
  });

  test('has rejecting counts as a failure', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    vi.spyOn(dataSource, 'has').mockRejectedValue(new Error('IndexedDB'));
    const migration = createMigration([legacy('a')], dataSource);
    await migration.run();
    await expect(dataSource.list()).resolves.toEqual([]);
    expect(stored(migration)).not.toBeNull();
  });

  test('IndexedDB unavailable keeps the key', async () => {
    const migration = createMigration(
      [legacy('a')],
      IndexedDBProjectsDataSource.createNull({ saveInError: true }),
    );
    await expect(migration.run()).resolves.toBeUndefined();
    expect(stored(migration)).not.toBeNull();
  });

  test('dirLink is dropped', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const project = Object.assign(legacy('a'), { dirLink: {} });
    await createMigration([project], dataSource).run();
    await expect(dataSource.dirLink('a')).resolves.toBeUndefined();
    const [migrated] = await dataSource.list();
    expect(migrated.dirLink).toBeUndefined();
  });

  test('oldest shape gets the defaults the app expects', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const oldest = {
      key: 0,
      name: 'Project (1)',
      data: [
        {
          id: '1',
          sequence: '1',
          action: 'action',
          place: 'salon',
          periode: 'matin',
          fx: '',
          url: '/project/0/images/1.jpg/',
        },
      ],
    };
    await createMigration([oldest], dataSource).run();
    await expect(dataSource.get('0')).resolves.toEqual({
      key: '0',
      name: 'Project (1)',
      data: [
        {
          id: '1',
          sequence: '1',
          action: 'action',
          label: 'salon',
          periode: 'matin',
          fx: '',
          url: '/project/0/images/1.jpg/',
        },
      ],
      colors: {},
      template: 'small',
      colorDistribution: 'indicator',
    });
  });

  test('a project without colors can get a new label', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const project = legacy('a') as Partial<Project>;
    delete project.colors;
    await createMigration([project], dataSource).run();

    await Application.createNull({ dataSource }).update('a', {
      id: '1',
      sequence: '1',
      label: 'new',
    });

    const migrated = await dataSource.get('a');
    expect(migrated.colors).toEqual({ new: '#F44336' });
  });

  test('null colours: a new label neither crashes nor reuses a colour', async () => {
    const dataSource = IndexedDBProjectsDataSource.createNull();
    const project = Object.assign(legacy('a'), {
      data: [
        { id: '1', sequence: '1', label: 'A' },
        { id: '2', sequence: '2', label: 'B' },
        { id: '3', sequence: '3' },
      ],
      colors: { A: null, B: '#E91E63' },
    });
    await createMigration([project], dataSource).run();

    await Application.createNull({ dataSource }).update('a', {
      id: '3',
      sequence: '3',
      label: 'C',
    } as Shot);

    const { colors } = await dataSource.get('a');
    expect(colors.C).toBeDefined();
    expect(colors.C).not.toEqual(colors.B);
  });
});

function legacy(key: string): Project {
  return {
    key,
    name: `Project ${key}`,
    data: [{ id: '1', sequence: '1', action: 'action', label: 'label' }],
    colors: { label: '#F44336' },
    template: 'small',
    colorDistribution: 'indicator',
    mainPicture: `/project/${key}/images/1.jpg/`,
  };
}

function createMigration(
  projects: unknown[],
  dataSource: IndexedDBProjectsDataSource,
) {
  return LocalStorageMigration.createNull({
    stored: JSON.stringify(projects),
    dataSource,
  });
}

function stored(migration: LocalStorageMigration) {
  return migration._localStorage.getItem('projects');
}

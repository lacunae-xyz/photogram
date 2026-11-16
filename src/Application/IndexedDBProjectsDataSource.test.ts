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

    // B14: the DB is updated before data.json is written, so a failed write leaves them out of sync.
    test('when data.json cannot be written, the DB is already updated (B14)', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      failWrites(source);

      await expect(
        source.save(createProject({ data: ['new'] })),
      ).rejects.toThrow('Permission for dir was denied');

      await expect(source.list()).resolves.toEqual([
        createProject({ data: ['new'] }),
      ]);
      await expect(source.get('key')).resolves.toEqual(createProject());
    });
  });

  // B15: list reads the DB, get reads data.json.
  describe('data.json edited outside the app (B15)', () => {
    test('list keeps the DB copy, get returns the file', async () => {
      const source = IndexedDBProjectsDataSource.createNull();
      await source.add(createProject());
      await editOutside(
        source,
        Object.assign(createProject(), { name: 'edited' }),
      );

      const listed = await source.list();
      expect(listed[0].name).toEqual(undefined);
      const project = await source.get('key');
      expect(project.name).toEqual('edited');
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

import IndexedDBProjectsDataSource from "./IndexedDBProjectsDataSource";
import type { Project } from "./types";

describe("IndexedDBProjectsDataSource", () => {
    describe("create", () => {
        beforeAll(() => {
            vi.stubGlobal('indexedDB', null);
        })
        afterAll(() => {
            vi.unstubAllGlobals();
        });
        test("happy path", () => {
            expect(() => IndexedDBProjectsDataSource.create()).not.toThrow();
        });
    });

    describe("list", () => {
        test("nothing", async () => {
            await expect(IndexedDBProjectsDataSource.createNull().list()).resolves.toEqual([]);
        });

        test("one project", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await expect(source.list()).resolves.toEqual([createProject()]);
        });
    })

    describe("get", () => {
        test("returns the project", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await expect(source.get("key")).resolves.toEqual(createProject());
        });

        test("fails is project not found", async () => {
            await expect(IndexedDBProjectsDataSource.createNull().get("key")).rejects.toThrow("Could not found project with id=key");
        });
    });

    describe("add", () => {
        test("one project", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await expect(source.add(createProject())).resolves.toEqual([createProject()]);
        });

        test("fails on error", async () => {
            const source = IndexedDBProjectsDataSource.createNull({ saveInError: true });
            await expect(source.add(createProject({}))).rejects.toThrow();
        });
    });

    describe("save", () => {
        test("one existing project", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await expect(source.save(createProject({ data: ["new"] }))).resolves.toEqual([createProject({ data: ["new"] })]);
        });

        test("fails if project does not exist", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await expect(source.save(createProject())).rejects.toThrow();
        });

        test("writes data.json", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await source.save(createProject({ data: ["new"] }));
            await expect(source.get("key")).resolves.toEqual(createProject({ data: ["new"] }));
        });

        // B14: the DB is updated before data.json is written, so a failed write leaves them out of sync.
        test("when data.json cannot be written, the DB is already updated (B14)", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            failWrites(source);

            await expect(source.save(createProject({ data: ["new"] }))).rejects.toThrow("Permission for dir was denied");

            await expect(source.list()).resolves.toEqual([createProject({ data: ["new"] })]);
            await expect(source.get("key")).resolves.toEqual(createProject());
        });
    })

    // B15: list reads the DB, get reads data.json.
    describe("data.json edited outside the app (B15)", () => {
        test("list keeps the DB copy, get returns the file", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await editOutside(source, Object.assign(createProject(), { name: "edited" }));

            const listed = await source.list();
            expect(listed[0].name).toEqual(undefined);
            const project = await source.get("key");
            expect(project.name).toEqual("edited");
        });
    });

    describe("delete", () => {
        test("one existing project", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await source.add(createProject());
            await expect(source.delete("key")).resolves.toEqual([]);
        });

        test("fails if project does not exist", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await expect(source.delete("key")).rejects.toThrow();
        });

        test("fails on error", async () => {
            const source = IndexedDBProjectsDataSource.createNull({ projects: [createProject()], saveInError: true });
            await expect(source.delete("key")).rejects.toThrow();
        });
    });

    describe("dirLink", () => {
        test("one existing project", async () => {
            const source = IndexedDBProjectsDataSource.createNull({ projects: [createProject()] });
            await expect(source.dirLink("key")).resolves.toEqual({ name: "dir" });
        })
        test("fails if project does not exist", async () => {
            const source = IndexedDBProjectsDataSource.createNull();
            await expect(source.dirLink("key")).rejects.toThrow()
        })
    });
});

function createProject({ data }: { data?: unknown[] } = { data: [] }) {
    return {
        data: data,
        key: "key",
        colors: {},
        dirLink: { name: "dir" },
    } as unknown as Project
}

function failWrites(source: IndexedDBProjectsDataSource) {
    source._fileHandle.write = async (dirHandle) => {
        throw Error(`Permission for ${dirHandle?.name} was denied`);
    };
}

async function editOutside(source: IndexedDBProjectsDataSource, project: Project) {
    const dirLink = project.dirLink;
    delete project.dirLink;
    await source._fileHandle.write(dirLink, "data.json", project);
}

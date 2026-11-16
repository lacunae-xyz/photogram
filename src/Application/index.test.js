import Application from "./index";
import Csv from "../FilesParser/Csv";
import ProjectsDataSource from "./ProjectsDataSource";
import Uuidv4 from "../FilesParser/uuidv4";
import Images from "../FilesParser/Images";
import IndexedDBProjectsDataSource from "./IndexedDBProjectsDataSource";
import MigrationDataSource from "./MigrationDataSource";

describe("Application", () => {

    describe("create", () => {
        beforeAll(() => {
            global.crypto = null;
            global.caches = null;
            global.indexedDB = null;
        })
        afterAll(() => {
            global.crypto = undefined;
            global.caches = undefined;
            global.indexedDB = undefined;
        })
        test("happy path", () => {
            expect(() => Application.create()).not.toThrowError();
        })
    });

    describe("add", () => {
        test("empty csv", async () => {
            const csv = createCsv();
            const expected = {
                key: Uuidv4.createNull().generate(),
                name: "Project (0)",
                data: await new Csv().execute([csv]),
                colors: {},
                template: "small",
            };
            await expect(Application.createNull().add([csv])).resolves.toEqual([expected]);
        });

        test("empty csv with webkitRelativePath", async () => {
            const csv = createCsv();
            csv.webkitRelativePath = "csv"
            const expected = {
                key: Uuidv4.createNull().generate(),
                name: "csv",
                data: await new Csv().execute([csv]),
                colors: {},
                template: "small",
            };
            await expect(Application.createNull().add([csv])).resolves.toEqual([expected]);
        });

        test("csv with one line", async () => {
            const csv = createCsv({ content: "1;action;label;periode;fx" });
            const expected = {
                key: Uuidv4.createNull().generate(),
                name: "Project (0)",
                data: await new Csv().execute([csv]),
                colors: { "label": "#F44336" },
                template: "small",
            };
            await expect(Application.createNull().add([csv])).resolves.toEqual([expected]);
        });

        test('csv with one line and image', async () => {
            const identifier = Uuidv4.createNull().generate();
            const csv = createCsv({ content: "1;action;label;periode;fx" });
            const png = createPng({ name: "1.png" });
            const data = await new Csv().execute([csv]);
            data[0].url = `/project/${identifier}/images/1.png/`
            const expected = {
                key: identifier,
                name: "Project (0)",
                data: data,
                colors: { "label": "#F44336" },
                template: "small",
            };
            const images = Images.createNull();
            await expect(Application.createNull({ images: images }).add([csv, png])).resolves.toEqual([expected]);
            await expect(images.has(identifier)).resolves.toEqual(true);
        })

        test("more than 16 labels wraps the palette", async () => {
            const labels = [...Array(17).keys()].map(i => `label${i}`);
            const csv = createCsv({ content: labels.map((label, i) => `${i + 1};action;${label}`).join("\n") });
            const project = await addProject(Application.createNull(), csv);
            expect(Object.keys(project.colors)).toEqual(labels);
            expect(project.colors["label0"]).toEqual("#F44336");
            expect(project.colors["label15"]).toEqual("#795548");
            expect(project.colors["label16"]).toEqual("#F44336");
        });

        test("empty and whitespace labels get no colour", async () => {
            const csv = createCsv({ content: "1;action;\n2;action;   \n3;action;label" });
            const project = await addProject(Application.createNull(), csv);
            expect(project.colors).toEqual({ "label": "#F44336" });
        });

        test("image 10 is not matched to row 1 and vice versa", async () => {
            const project = await addProject(Application.createNull(), createCsv({ content: "1;a\n10;b" }), [
                createJpg({ name: "10.jpg" }), createJpg({ name: "1.jpg" }),
            ]);
            expect(project.data.map(d => d.url)).toEqual([imageUrl("1.jpg"), imageUrl("10.jpg")]);
        });

        test("two images for one row takes the first", async () => {
            const project = await addProject(Application.createNull(), createCsv({ content: "1;a" }), [
                createJpg({ name: "1.jpg" }), createPng({ name: "1.png" }),
            ]);
            expect(project.data[0].url).toEqual(imageUrl("1.jpg"));
        });

        test("upper case extension", async () => {
            const project = await addProject(Application.createNull(), createCsv({ content: "1;a" }), [
                createJpg({ name: "1.JPG" }),
            ]);
            expect(project.data[0].url).toEqual(imageUrl("1.JPG"));
        });

        test("row without image has no url", async () => {
            const project = await addProject(Application.createNull(), createCsv({ content: "1;a\n2;b" }), [
                createJpg({ name: "1.jpg" }),
            ]);
            expect(project.data[1].url).toEqual(undefined);
        });

        test("ignores data.json", async () => {
            const csv = createCsv({ content: "1;action" });
            const json = createJson({ content: JSON.stringify({ key: "other", name: "from json", data: [], colors: {} }) });
            const projects = await Application.createNull().add([csv, json]);
            expect(projects).toEqual([{
                key: Uuidv4.createNull().generate(),
                name: "Project (0)",
                data: await new Csv().execute([csv]),
                colors: {},
                template: "small",
            }]);
        });

        test("fails if no data.csv is present", async () => {
            await expect(Application.createNull().add([])).rejects.toThrow("Could not found data.csv");
        });

        test("fails if project cannot be saved", async () => {
            const csv = createCsv();
            const source = Application.createNull({
                dataSource: ProjectsDataSource.createNull({ saveInError: true })
            });
            await expect(source.add([csv])).rejects.toThrow("QuotaExceededError");
        });
    });

    describe("open", () => {

        function createDirHandle(files, directories = []) {
            return {
                name: "dir",
                values: () => directories.map(name => {
                    return {
                        kind: "directory",
                        name: name,
                    }
                }).concat(files.map(file => {
                    return {
                        kind: "file",
                        getFile: () => file,
                    }
                }))
            };
        }
        test("empty csv", async () => {
            const csv = createCsv();
            const dirHandle = createDirHandle([csv]);
            const expected = {
                key: Uuidv4.createNull().generate(),
                name: "dir",
                data: await new Csv().execute([csv]),
                colors: {},
                template: "small",
                dirLink: dirHandle,
            };
            await expect(Application.createNull().open(dirHandle)).resolves.toEqual([expected]);
        });

        test("csv with one line", async () => {
            const csv = createCsv({ content: "1;action;label;periode;fx" });
            const dirHandle = createDirHandle([csv]);
            const expected = {
                key: Uuidv4.createNull().generate(),
                name: "dir",
                data: await new Csv().execute([csv]),
                colors: { "label": "#F44336" },
                template: "small",
                dirLink: dirHandle,
                mainPicture: undefined,
            };
            await expect(Application.createNull().open(dirHandle)).resolves.toEqual([expected]);
        });

        test('csv with one line and image', async () => {
            const identifier = Uuidv4.createNull().generate();
            const csv = createCsv({ content: "1;action;label;periode;fx" });
            const png = createPng({ name: "1.png" });
            const dirHandle = createDirHandle([csv, png]);
            const data = await new Csv().execute([csv]);
            const imageUrl = `/project/${identifier}/images/1.png/`;
            data[0].url = imageUrl
            const expected = {
                key: identifier,
                name: "dir",
                data: data,
                colors: { "label": "#F44336" },
                template: "small",
                dirLink: dirHandle,
                mainPicture: imageUrl,
            };
            const images = Images.createNull();
            await expect(Application.createNull({ images: images }).open(dirHandle)).resolves.toEqual([expected]);
            await expect(images.has(identifier)).resolves.toEqual(true);
        })

        test("from data.json", async () => {
            const source = Application.createNull();
            const project = createProject();
            delete project.dirLink;
            const json = JSON.stringify(project);
            const dirHandle = createDirHandle([createJson({ content: json })]);
            await expect(source.open(dirHandle)).resolves.toEqual([createProject({ dirLink: dirHandle })]);
        });

        test("subdirectories are ignored", async () => {
            const csv = createCsv({ content: "1;action" });
            const dirHandle = createDirHandle([csv], ["sub"]);
            const projects = await Application.createNull().open(dirHandle);
            expect(projects[0].data).toEqual(await new Csv().execute([csv]));
        });

        test("invalid data.json rejects", async () => {
            const dirHandle = createDirHandle([createJson({ content: "{ not json" }), createCsv()]);
            await expect(Application.createNull().open(dirHandle)).rejects.toThrow(SyntaxError);
        });

        test("from data.json re-caches images under the project key", async () => {
            const images = Images.createNull();
            const project = createProject();
            delete project.dirLink;
            const dirHandle = createDirHandle([createJson({ content: JSON.stringify(project) }), createJpg({ name: "1.jpg" })]);
            await Application.createNull({ images: images }).open(dirHandle);
            await expect(images.has(project.key)).resolves.toEqual(true);
            await expect(images.has(Uuidv4.createNull().generate())).resolves.toEqual(false);
        });

        test("fails if no data.csv is present", async () => {
            await expect(Application.createNull().open(createDirHandle([]))).rejects.toThrow("Could not found data.csv");
        });

        test("fails if project cannot be saved", async () => {
            const csv = createCsv();
            const source = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({ saveInError: true })
            });
            await expect(source.open(createDirHandle([csv]))).rejects.toThrow();
        });
    });


    describe("list", () => {
        test("empty", async () => {
            await expect(Application.createNull().list()).resolves.toEqual([]);
        })

        test("one item", async () => {
            const application = Application.createNull();
            const project = await addProject(application);
            await expect(application.list()).resolves.toEqual([project]);
        });

        test("opened projects first, then imported ones", async () => {
            const imported = Object.assign(createProject({ dirLink: null }), { key: "imported" });
            delete imported.dirLink;
            const opened = Object.assign(createProject(), { key: "opened" });
            const application = Application.createNull({
                dataSource: new MigrationDataSource(
                    IndexedDBProjectsDataSource.createNull({ projects: [opened] }),
                    ProjectsDataSource.createNull({ projects: [imported] }),
                )
            });
            const projects = await application.list();
            expect(projects.map(p => p.key)).toEqual(["opened", "imported"]);
        });
    });

    describe("delete", () => {
        test("delete one item", async () => {
            const images = Images.createNull();
            const application = Application.createNull({ images: images });
            const project = await addProject(application);
            await expect(application.delete(project.key)).resolves.toEqual([]);
            await expect(images.has(project.key)).resolves.toEqual(false);
        });

        test("fails is project not present", async () => {
            await expect(Application.createNull().delete("id")).rejects.toThrow("");
        });

        // B1: the project is removed, then clearing the missing cache rejects. The fix resolves with [].
        test("project without image cache rejects after removing it (B1)", async () => {
            const images = Images.createNull();
            const application = Application.createNull({ images: images });
            const project = await addProject(application, createCsv(), []);
            await expect(images.has(project.key)).resolves.toEqual(false);

            await expect(application.delete(project.key)).rejects.toThrow(`Cannot delete the cache: ${project.key}`);
            await expect(application.list()).resolves.toEqual([]);
        });
    });

    describe("get", () => {
        test("returns the project", async () => {
            const application = Application.createNull();
            const project = await addProject(application);
            await expect(application.get(project.key)).resolves.toEqual(project);
        });

        test("fails is project not found", async () => {
            await expect(Application.createNull().get("id")).rejects.toThrow("Could not found project with id=id");
        });
    });

    describe("update", () => {
        test("found element", async () => {
            const application = Application.createNull();
            const project = await addProject(application, createCsv({ content: "1" }));
            const changed = { id: "1", action: "action" };

            await application.update(project.key, changed);

            const actual = await application.get(project.key);
            expect(actual.data).toEqual([changed]);
        });

        test("new label", async () => {
            const application = Application.createNull();
            const project = await addProject(application, createCsv({ content: "1" }));
            const changed = { id: "1", label: "label" };

            await application.update(project.key, changed);

            const actual = await application.get(project.key);
            expect(actual.data).toEqual([changed]);
            expect(actual.colors).toEqual({ "label": "#F44336" });
        });

        test("do nothing if element not found", async () => {
            const application = Application.createNull();
            const project = await addProject(application, createCsv({ content: "1" }));
            const changed = { id: "2", action: "action" };

            await application.update(project.key, changed);

            await expect(application.get(project.key)).resolves.toEqual(project);
        });

        test("fails is project not found", async () => {
            await expect(Application.createNull().update("id", null)).rejects.toThrow("Could not found project with id=id");
        });
    });

    describe("needsPermission", () => {
        test("true", async () => {
            const application = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: createDirLink({ queryPermission: () => "prompt" }) })]
                })
            });
            await expect(application.needsPermission("key")).resolves.toEqual(true);
        });

        test("false if already granted", async () => {
            const application = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: createDirLink({ queryPermission: () => "granted" }) })]
                })
            });
            await expect(application.needsPermission("key")).resolves.toEqual(false);
        });

        test("false when denied", async () => {
            const application = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: createDirLink({ queryPermission: () => "denied" }) })]
                })
            });
            await expect(application.needsPermission("key")).resolves.toEqual(false);
        });

        test("false if no dirLink present", async () => {
            const application = Application.createNull({
                dataSource: ProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: null })]
                })
            });
            await expect(application.needsPermission("key")).resolves.toEqual(false);
        });
    });

    describe("requestPermission", () => {
        test("granted", async () => {
            const application = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: createDirLink({ requestPermission: () => "granted" }) })]
                })
            });
            await expect(application.requestPermission("key")).resolves.toEqual();
        });

        test("fails when denied", async () => {
            const application = Application.createNull({
                dataSource: IndexedDBProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: createDirLink({ requestPermission: () => "denied" }) })]
                })
            });
            await expect(application.requestPermission("key")).rejects.toThrow("Permission for dir was denied");
        });

        test("false if no dirLink present", async () => {
            const application = Application.createNull({
                dataSource: ProjectsDataSource.createNull({
                    projects: [createProject({ dirLink: null })]
                })
            });
            await expect(application.requestPermission("key")).rejects.toThrow("No directory is defined");
        });
    });

    describe("color", () => {
        describe("update", () => {
            test("update the one found, create the other one", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv({ content: "1;action;label;periode;fx" }));
                const changed = { label: "#000000", other: "#FFFFFF" };

                await application.updateColor(project.key, changed);

                const actual = await application.get(project.key);
                expect(actual.colors).toEqual(changed);
            });
            test("fails is project not found", async () => {
                await expect(Application.createNull().updateColor("id", null)).rejects.toThrow("Could not found project with id=id");
            });
        });

        describe("delete", () => {
            test("found color", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv({ content: "1;action;label;periode;fx" }));

                await application.deleteColor(project.key, "label");

                const actual = await application.get(project.key);
                expect(actual.colors).toEqual({});
                expect(actual.data[0].label).toEqual(undefined);
            });

            // B13: deleteColor leaves an undefined key that JSON drops, so the next label reuses a colour.
            test("new label after delete with a JSON round trip reuses a colour (B13)", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv({ content: "1;a;A\n2;b;B\n3;c;C\n4;d" }));

                await application.deleteColor(project.key, "A");
                await application.update(project.key, { id: "4", label: "D" });

                const actual = await application.get(project.key);
                expect(actual.colors).toEqual({ B: "#E91E63", C: "#9C27B0", D: "#9C27B0" });
            });

            test("new label after delete without a JSON round trip gets a new colour", async () => {
                const project = Object.assign(createProject(), {
                    data: [{ id: "1", label: "A" }, { id: "2", label: "B" }, { id: "3", label: "C" }, { id: "4" }],
                    colors: { A: "#F44336", B: "#E91E63", C: "#9C27B0" },
                });
                const application = Application.createNull({
                    dataSource: IndexedDBProjectsDataSource.createNull({ projects: [project] })
                });

                await application.deleteColor("key", "A");
                await application.update("key", { id: "4", label: "D" });

                const actual = await application.get("key");
                expect(actual.colors).toEqual({ A: undefined, B: "#E91E63", C: "#9C27B0", D: "#3F51B5" });
            });

            test("do nothing if element not found", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv({ content: "1;action;label;periode;fx" }));

                await application.deleteColor(project.key, "unkown");

                await expect(application.get(project.key)).resolves.toEqual(project);
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().deleteColor("id", null)).rejects.toThrow();
            });
        });

        describe("distribution", () => {
            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updateColorDistribution(project.key, "card");

                const actual = await application.get(project.key);
                expect(actual.colorDistribution).toEqual("card");
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().updateColorDistribution("id", null)).rejects.toThrow("Could not found project with id=id");
            });
        });
    });

    describe("update", () => {
        describe("default color", () => {
            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updateDefaultColor(project.key, "#000000");

                const actual = await application.get(project.key);
                expect(actual.defaultColor).toEqual("#000000");
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().updateDefaultColor("id", "#000000")).rejects.toThrow("Could not found project with id=id");
            });
        });
        describe("font family", () => {
            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updateFontFamily(project.key, "font");

                const actual = await application.get(project.key);
                expect(actual.fontFamily).toEqual("font");
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().updateFontFamily("id", "font")).rejects.toThrow("Could not found project with id=id");
            });
        });
        describe("print space around", () => {
            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updatePrintSpaceAround(project.key, true);

                const actual = await application.get(project.key);
                expect(actual.printSpaceAround).toEqual(true);
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().updatePrintSpaceAround("id", true)).rejects.toThrow("Could not found project with id=id");
            });
        });

        describe("template", () => {
            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updateTemplate(project.key, "large");

                const actual = await application.get(project.key);
                expect(actual.template).toEqual("large");
            });
            test("fails is project not found", async () => {
                await expect(Application.createNull().updateTemplate("id", "large")).rejects.toThrow("Could not found project with id=id");
            });
        });

        describe("main picture", () => {

            test("update", async () => {
                const application = Application.createNull();
                const project = await addProject(application, createCsv());

                await application.updateMainPicture(project.key, "2");

                const actual = await application.get(project.key);
                expect(actual.mainPicture).toEqual("2");
            });

            test("fails is project not found", async () => {
                await expect(Application.createNull().updateMainPicture("id", "é")).rejects.toThrow("Could not found project with id=id");
            });
        });
    });

    describe("legacy localStorage projects", () => {
        const legacy = {
            key: "legacy",
            name: "Legacy",
            data: [{ id: "1", sequence: "1", action: "action", label: "label", periode: "matin", fx: "" }],
            colors: { label: "#F44336" },
            template: "small",
            mainPicture: "/project/legacy/images/1.jpg/",
        };

        function createApplication() {
            return Application.createNull({
                dataSource: new MigrationDataSource(
                    IndexedDBProjectsDataSource.createNull(),
                    ProjectsDataSource.create(),
                )
            });
        }

        beforeEach(() => {
            localStorage.setItem("projects", JSON.stringify([legacy]));
        });

        afterEach(() => {
            localStorage.clear();
        });

        test("list", async () => {
            await expect(createApplication().list()).resolves.toEqual([legacy]);
        });

        test("get", async () => {
            await expect(createApplication().get("legacy")).resolves.toEqual(legacy);
        });

        test("save keeps the shape", async () => {
            await createApplication().update("legacy", { id: "1", sequence: "1", action: "changed", label: "other" });

            expect(JSON.parse(localStorage.getItem("projects"))).toEqual([Object.assign({}, legacy, {
                data: [{ id: "1", sequence: "1", action: "changed", label: "other" }],
                colors: { label: "#F44336", other: "#E91E63" },
            })]);
        });

        test("delete", async () => {
            const images = Images.createNull();
            const application = Application.createNull({
                images: images,
                dataSource: new MigrationDataSource(
                    IndexedDBProjectsDataSource.createNull(),
                    ProjectsDataSource.create(),
                )
            });
            await images.execute("legacy", [createJpg({ name: "1.jpg" })]);

            await expect(application.delete("legacy")).resolves.toEqual([]);
            expect(JSON.parse(localStorage.getItem("projects"))).toEqual([]);
        });
    });
});

async function addProject(application, csv = createCsv(), images = [createPng()]) {
    const result = await application.add([csv, ...images]);
    return result[result.length - 1];
}

function imageUrl(name) {
    return `/project/${Uuidv4.createNull().generate()}/images/${name}/`;
}

function createJpg({ name = "image.jpg", content = "" } = {}) {
    return new File([content], name, { type: 'image/jpeg' });
}

function createCsv({ name = "data.csv", content = "" } = {}) {
    return new File([content], name, { type: 'text/csv' });
}

function createPng({ name = "image.png", content = "" } = {}) {
    return new File([content], name, { type: 'image/png' });
}

function createJson({ name = "data.json", content = "" } = {}) {
    return new File([content], name, { type: 'text/json' });
}

function createDirLink({
    name = "dir",
    requestPermission = () => "prompt",
    queryPermission = () => "denied",
} = {}) {
    return {
        name: name,
        requestPermission: requestPermission,
        queryPermission: queryPermission,
    }
}

function createProject({ data = [], dirLink = createDirLink() } = {}) {
    return {
        data: data,
        key: "key",
        colors: {},
        dirLink: dirLink,
    }
}
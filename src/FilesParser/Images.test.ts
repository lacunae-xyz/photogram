import Images from './Images';

describe("Images", () => {

    describe("create", () => {
        beforeAll(() => {
            vi.stubGlobal('caches', null);
        })
        afterAll(() => {
            vi.unstubAllGlobals();
        })
        test("happy path", () => {
            expect(() => Images.create()).not.toThrowError();
        })
    });

    describe("execute", () => {
        test("put an image in storage", async () => {
            await expect(Images.createNull().execute("id", [createPng()])).resolves.toEqual([{
                name: "not_data.png",
                url: "/project/id/images/not_data.png/"
            }]);
        });

        test("keeps upper case extensions in the url", async () => {
            await expect(Images.createNull().execute("id", [createFile("1.JPG", "", "image/jpeg")])).resolves.toEqual([{
                name: "1.JPG",
                url: "/project/id/images/1.JPG/"
            }]);
        });

        test("filters on MIME type, not extension", async () => {
            await expect(Images.createNull().execute("id", [
                createFile("1.jpg", "", ""),
                createFile("2.jpg", "", "application/octet-stream"),
                createFile("3.bin", "", "image/png"),
            ])).resolves.toEqual([{
                name: "3.bin",
                url: "/project/id/images/3.bin/"
            }]);
        });

        test("ignores non image type", async () => {
            await expect(Images.createNull().execute("id", [createFile("file.txt", "", "plain/text")])).resolves.toEqual([]);
        });

        test("fails if quota is exceeded", async () => {
            await expect(Images.createNull({
                factory: () => { throw new TypeError("Bad url") }
            }).execute("id", [createPng()])).rejects.toThrow("Bad url");
        });
    });

    describe("Clear", () => {
        test("returns null if present", async () => {
            const images = Images.createNull();
            await images.execute("id", [createPng()]);
            await expect(images.clear("id")).resolves.toEqual(null);
        });

        // B1: clear rejects when there is no cache, the fix resolves instead.
        test("fails if not present", async () => {
            await expect(Images.createNull().clear("id")).rejects.toThrow("Cannot delete the cache: id");
        });

        test("fails if if empty", async () => {
            const images = Images.createNull();
            await images.execute("id", []);
            await expect(Images.createNull().clear("id")).rejects.toThrow("Cannot delete the cache: id");
        });
    })

    describe("has", () => {
        test("returns true if present", async () => {
            const images = Images.createNull();
            await images.execute("id", [createPng()]);
            await expect(images.has("id")).resolves.toEqual(true);
        });

        test("return false if not present", async () => {
            await expect(Images.createNull().has("id")).resolves.toEqual(false);
        });
    })
});

function createPng({ name = "not_data.png", content = "" } = {}) {
    return createFile(name, content, 'image/png')
}

function createFile(name: string, content: string, type: string) {
    return new File([content], name, { type: type })
}
import Csv from './Csv';
import type { Shot } from '../Application/types';

describe("Csv", () => {
    test("parse empty file", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: ""
        })])).resolves.toEqual([]);

    });

    test("parse one line with just id", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1"
        })])).resolves.toEqual([{
            action: undefined,
            fx: undefined,
            id: "1",
            label: "",
            periode: "",
            sequence: "1"
        }]);
    });

    test("parse one line with all information", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1;action;label;periode;fx"
        })])).resolves.toEqual([{
            action: "action",
            fx: "fx",
            id: "1",
            label: "label",
            periode: "periode",
            sequence: "1"
        }]);
    });

    test("Ignore lines that do not start with number", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "A"
        })])).resolves.toEqual([]);
    });
    test("quoted field with delimiter and newline", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: '1;"action; with\nnewline";label;matin;fx'
        })])).resolves.toEqual([
            row("1", { action: "action; with\nnewline", label: "label", periode: "matin", fx: "fx" }),
        ]);
    });

    test("quoted comma with comma delimiter", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: '1,"a, b",label,matin,\n2,c,,,'
        })])).resolves.toEqual([
            row("1", { action: "a, b", label: "label", periode: "matin", fx: "" }),
            row("2", { action: "c", fx: "" }),
        ]);
    });

    test("comma inside unquoted field with semicolon delimiter", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1;a, b;l;matin;\n2;c;l;soir;"
        })])).resolves.toEqual([
            row("1", { action: "a, b", label: "l", periode: "matin", fx: "" }),
            row("2", { action: "c", label: "l", periode: "soir", fx: "" }),
        ]);
    });

    test("BOM is ignored", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "\uFEFF1;action;label;matin;fx"
        })])).resolves.toEqual([
            row("1", { action: "action", label: "label", periode: "matin", fx: "fx" }),
        ]);
    });

    test("CRLF line endings", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1;a;l;matin;\r\n2;b;l;soir;\r\n"
        })])).resolves.toEqual([
            row("1", { action: "a", label: "l", periode: "matin", fx: "" }),
            row("2", { action: "b", label: "l", periode: "soir", fx: "" }),
        ]);
    });

    test("trailing empty lines are ignored", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1;a;l;;\n\n"
        })])).resolves.toEqual([
            row("1", { action: "a", label: "l", fx: "" }),
        ]);
    });

    test("short rows", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "1\n2;a\n3;a;l"
        })])).resolves.toEqual([
            row("1"),
            row("2", { action: "a" }),
            row("3", { action: "a", label: "l" }),
        ]);
    });

    test("ids starting with a digit are kept and trimmed", async () => {
        await expect(new Csv().execute([createFile({
            name: "data.csv",
            content: "12A;a\n1.2;b\n 3 ;c\nA1;d"
        })])).resolves.toEqual([
            row("12A", { action: "a" }),
            row("1.2", { action: "b" }),
            row("3", { action: "c" }),
        ]);
    });

    test("fails with no files", async () => {
        await expect(new Csv().execute([createFile()])).rejects.toThrow("Could not found data.csv")
    });
});

function createFile({ name = "not_data.csv", content = "" } = {}) {
    return new File([content], name, { type: 'text/csv' })
}

function row(id: string, { action, label = "", periode = "", fx }: Partial<Shot> = {}): Shot {
    return { id: id, sequence: id, action: action, label: label, periode: periode, fx: fx };
}

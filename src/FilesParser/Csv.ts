import Papa, { type ParseResult } from 'papaparse';
import type { Shot } from '../Application/types';

export default class Csv {

    async execute(files: ArrayLike<File> | Iterable<File>): Promise<Shot[]> {
        const csv = Array.from(files).find(file => file.name === "data.csv");
        if (csv === undefined) {
            throw new Error('Could not found data.csv');
        }
        const parsed = await this.parseCsv(csv);

        return parsed.data.map(r => {
            const id = this.parseId(r[0])
            if (id !== null) {
                return {
                    id: id,
                    sequence: id,
                    action: r[1],
                    label: (r[2] || "").trim(),
                    periode: (r[3] || "").trim(),
                    fx: r[4],
                };
            } else {
                return null;
            }
        }).filter(line => line !== null);


    }

    async parseCsv(file: File): Promise<ParseResult<string[]>> {
        return new Promise((resolve, reject) => Papa.parse<string[]>(file, {
            complete: resolve,
            error: reject
        }));
    }

    parseId(id: string) {
        const trimedId = id.trim()
        const pattern = /^\d/
        if (trimedId.match(pattern) !== null) {
            return trimedId
        }
        return null
    }
}

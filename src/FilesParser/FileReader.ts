export interface ReadResult<T> {
    file: File;
    result: T;
}

function readAsArrayBuffer(file: File): Promise<ReadResult<ArrayBuffer>> {
    return new Promise((resolve, reject) => {
        _createReader(resolve, reject, file).readAsArrayBuffer(file);
    });
}

function readAsText(file: File): Promise<ReadResult<string>> {
    return new Promise((resolve, reject) => {
        _createReader(resolve, reject, file).readAsText(file);
    });
}

function _createReader<T>(resolve: (value: ReadResult<T>) => void, reject: (reason: Error) => void, file: File) {
    const reader = new FileReader();
    reader.onerror = () => {
        reader.abort();
        reject(new Error("Problem parsing input file."));
    };
    reader.onload = () => {
        resolve({ file: file, result: reader.result as T });
    };
    return reader
}

export { readAsText, readAsArrayBuffer }

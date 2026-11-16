import parser from './parser';

const readUploadedFileAsText = inputFile => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    temporaryFileReader.onload = () => {
      resolve({
        file: inputFile,
        result: temporaryFileReader.result,
      });
    };
    temporaryFileReader.readAsText(inputFile);
  });
};

const readUploadedFileAsUrl = inputFile => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    temporaryFileReader.onload = () => {
      resolve({
        file: inputFile,
        result: temporaryFileReader.result,
      });
    };
    temporaryFileReader.readAsDataURL(inputFile);
  });
};

const compress = inputFile => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    temporaryFileReader.onload = () => {
      const img = new Image();
      img.src = temporaryFileReader.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const width = 320;
        const height = img.height * (width / img.width);
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        // img.width and img.height will contain the original dimensions
        ctx.drawImage(img, 0, 0, width, height);
        ctx.canvas.toBlob(
          blob => {
            resolve(
              new File([blob], inputFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }),
            );
          },
          'image/jpeg',
          1,
        );
      };
      img.onerror = () => {
        reject(new DOMException('Problem parsing input file.'));
      };
    };
    temporaryFileReader.readAsDataURL(inputFile);
  });
};

export function parseName(files, defaultName) {
  return Promise.resolve(Array.from(files).find(file => true)).then(file => {
    let name;
    if (file !== undefined && file.webkitRelativePath) {
      name = file.webkitRelativePath.split('/')[0];
    } else {
      name = defaultName;
    }
    return name;
  });
}

export function parseData(files) {
  return Promise.all(
    Array.from(files).filter(file => file.name.endsWith('.edl')),
  )
    .then(edls => {
      return Promise.all(edls.map(edl => readUploadedFileAsText(edl)));
    })
    .then(rawContents => {
      return rawContents.map(rawContent => {
        return {
          file: rawContent.file,
          data: parser(rawContent.result),
        };
      });
    })
    .then(results => {
      return results
        .map(r => r.data)
        .flat()
        .sort((a, b) => a.id.localeCompare(b.id));
    });
}

export function parseImages(files) {
  let imageType = /^image\//;

  return Promise.all(
    Array.from(files).filter(file => imageType.test(file.type)),
  ).then(images => {
    return Promise.all(
      images.map(image =>
        compress(image).then(smallImage => readUploadedFileAsUrl(smallImage)),
      ),
    );
  });
}

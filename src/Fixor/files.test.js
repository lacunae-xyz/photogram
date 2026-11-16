import { parseName, parseData, parseImages } from './files';

const event = (
  number,
  id,
) => `${number}  A003C003 V     C        16:51:25:10 16:51:28:00 01:01:05:19 01:01:08:09
* FROM CLIP NAME:  210/01-03* CAMA
* LOC: 1:01:06:16  CYAN    ${id} // SPLIT SCREEN
* SOURCE FILE: A003C003_190318BQ`;

describe('parseName', () => {
  test('folder name from webkitRelativePath', async () => {
    await expect(
      parseName([createFile('a.edl', '', '', 'folder/a.edl')], 'default'),
    ).resolves.toEqual('folder');
  });

  test('default name without webkitRelativePath', async () => {
    await expect(parseName([createFile('a.edl')], 'default')).resolves.toEqual(
      'default',
    );
  });

  test('default name without files', async () => {
    await expect(parseName([], 'default')).resolves.toEqual('default');
  });
});

describe('parseData', () => {
  test('parses every .edl file, sorted by id', async () => {
    const result = await parseData([
      createFile('b.edl', event('002', '300_010')),
      createFile('notes.txt', event('003', '100_010')),
      createFile(
        'a.edl',
        [event('001', '200_010'), event('004', '100_020')].join('\n'),
      ),
    ]);
    expect(result.map(line => line.id)).toEqual([
      '100_020',
      '200_010',
      '300_010',
    ]);
  });

  test('no edl', async () => {
    await expect(parseData([createFile('a.txt', '')])).resolves.toEqual([]);
  });

  test('upper case extension (B26)', async () => {
    const result = await parseData([
      createFile('A.EDL', event('001', '100_010')),
    ]);
    expect(result.map(line => line.id)).toEqual(['100_010']);
  });
});

describe('parseImages', () => {
  test('ignores files that are not images', async () => {
    await expect(
      parseImages([createFile('a.edl', ''), createFile('a.jpg', '', '')]),
    ).resolves.toEqual([]);
  });
});

function createFile(name, content = '', type = '', webkitRelativePath) {
  const file = new File([content], name, { type: type });
  if (webkitRelativePath) {
    Object.defineProperty(file, 'webkitRelativePath', {
      value: webkitRelativePath,
    });
  }
  return file;
}

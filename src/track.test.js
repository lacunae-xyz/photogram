import { beforeSend, cleanUrl } from './track';
import Uuidv4 from './FilesParser/uuidv4';

const uuid = Uuidv4.createNull().generate();

describe('cleanUrl', () => {
  test('uuid in an absolute URL', () => {
    expect(cleanUrl(`https://photogram.app/project/${uuid}`)).toEqual(
      'https://photogram.app/project/{id}',
    );
  });

  test('uuid in the middle of a path', () => {
    expect(cleanUrl(`/project/${uuid}/edit`)).toEqual('/project/{id}/edit');
  });

  test('number', () => {
    expect(cleanUrl('/project/01')).toEqual('/project/{id}');
  });

  test('port and query are kept', () => {
    expect(cleanUrl(`http://localhost:5000/project/${uuid}?a=1`)).toEqual(
      'http://localhost:5000/project/{id}?a=1',
    );
  });

  test('no id', () => {
    expect(cleanUrl('https://photogram.app/projects')).toEqual(
      'https://photogram.app/projects',
    );
  });

  test('empty and missing', () => {
    expect(cleanUrl('')).toEqual('');
    expect(cleanUrl(undefined)).toBeUndefined();
    expect(cleanUrl(null)).toBeNull();
  });
});

describe('beforeSend', () => {
  test('cleans url and referrer, keeps the rest', () => {
    expect(
      beforeSend('event', {
        website: 'site',
        url: `https://photogram.app/project/${uuid}`,
        referrer: '/projects',
        name: 'project-print',
      }),
    ).toEqual({
      website: 'site',
      url: 'https://photogram.app/project/{id}',
      referrer: '/projects',
      name: 'project-print',
    });
  });
});

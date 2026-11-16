import { nextColor, normalizeHex, palette } from './colors';

describe('normalizeHex', () => {
  test.each([
    ['#fff', '#ffffff'],
    ['#FFF', '#ffffff'],
    ['#F44336', '#f44336'],
    ['#f44336', '#f44336'],
    [' #abc ', '#aabbcc'],
  ])('%s gives %s (B12)', (color, expected) => {
    expect(normalizeHex(color)).toEqual(expected);
  });

  test.each(['red', '#ff', '#ffff', '#gggggg', '', undefined])(
    '%s is not a hex colour',
    color => {
      expect(normalizeHex(color)).toEqual(undefined);
    },
  );
});

describe('nextColor (B13)', () => {
  test('first palette colour when none is used', () => {
    expect(nextColor([])).toEqual('#F44336');
  });

  test('first unused palette colour, lowest index', () => {
    expect(nextColor(['#E91E63', '#9C27B0'])).toEqual('#F44336');
  });

  test('palette colours match whatever their case or length', () => {
    expect(nextColor(['#f44336', '#e91e63'])).toEqual('#9C27B0');
  });

  test('colours outside the palette do not count', () => {
    expect(nextColor(['#123456', '#fff', undefined])).toEqual('#F44336');
  });

  test('all used: least used, lowest index on ties', () => {
    const used = [...palette, ...palette.slice(0, 3), palette[5]];
    expect(nextColor(used)).toEqual(palette[3]);
  });
});

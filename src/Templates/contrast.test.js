import getContrastYIQ, { blackOrWhite } from './contrast';

describe('getContrastYIQ', () => {
  test.each([
    ['#F44336', 'light'],
    ['#E91E63', 'light'],
    ['#9C27B0', 'light'],
    ['#3F51B5', 'light'],
    ['#2196F3', 'light'],
    ['#03A9F4', 'light'],
    ['#00BCD4', 'light'],
    ['#009688', 'light'],
    ['#4CAF50', 'light'],
    ['#8BC34A', 'light'],
    ['#CDDC39', 'dark'],
    ['#FFEB3B', 'dark'],
    ['#FFC107', 'light'],
    ['#FF9800', 'light'],
    ['#FF5722', 'light'],
    ['#795548', 'light'],
  ])('palette %s gives %s text', (color, expected) => {
    expect(getContrastYIQ(color)).toEqual(expected);
  });

  test('white gives dark text', () => {
    expect(getContrastYIQ('#FFFFFF')).toEqual('dark');
  });

  test('lower case hex', () => {
    expect(getContrastYIQ('#ffffff')).toEqual('dark');
  });

  test('black gives light text', () => {
    expect(getContrastYIQ('#000000')).toEqual('light');
  });

  test('3-digit white gives dark text (B12)', () => {
    expect(getContrastYIQ('#fff')).toEqual('dark');
  });

  test('3-digit black gives light text (B12)', () => {
    expect(getContrastYIQ('#000')).toEqual('light');
  });
});

describe('blackOrWhite', () => {
  test.each([
    ['#F44336', '#000000'],
    ['#E91E63', '#000000'],
    ['#9C27B0', '#ffffff'],
    ['#3F51B5', '#ffffff'],
    ['#2196F3', '#000000'],
    ['#03A9F4', '#000000'],
    ['#00BCD4', '#000000'],
    ['#009688', '#000000'],
    ['#4CAF50', '#000000'],
    ['#8BC34A', '#000000'],
    ['#CDDC39', '#000000'],
    ['#FFEB3B', '#000000'],
    ['#FFC107', '#000000'],
    ['#FF9800', '#000000'],
    ['#FF5722', '#000000'],
    ['#795548', '#ffffff'],
    ['#fff', '#000000'],
    ['#000', '#ffffff'],
    ['red', undefined],
  ])('%s takes %s', (color, expected) => {
    expect(blackOrWhite(color)).toEqual(expected);
  });
});

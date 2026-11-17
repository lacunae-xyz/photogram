import { toPeriod } from './period';

describe('period', () => {
  test.each([
    ['matin', 'morning'],
    ['jour', 'day'],
    ['soir', 'evening'],
    ['nuit', 'night'],
    ['MATIN', 'morning'],
    ['Nuit', 'night'],
    ['m', 'morning'],
    ['morning', 'morning'],
    ['', undefined],
    [undefined, undefined],
    ['après-midi', undefined],
    [' matin', undefined],
  ])('%s is %s', (value, period) => {
    expect(toPeriod(value)).toEqual(period);
  });
});

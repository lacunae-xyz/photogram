import { periodToClassName, periodToIcon } from './period';

const night = 'weather-night';
const sunny = 'weather-sunny';
const sunsetUp = 'weather-sunset-up';
const sunsetDown = 'weather-sunset-down';
const none = 'weather-none';

describe('period', () => {
  test.each([
    ['matin', 'dot-light', sunsetUp],
    ['jour', 'dot-lighter', sunny],
    ['soir', 'dot-dark', sunsetDown],
    ['nuit', 'dot-darker', night],
    ['MATIN', 'dot-light', sunsetUp],
    ['Nuit', 'dot-darker', night],
    ['m', 'dot-light', sunsetUp],
    ['morning', 'dot-light', sunsetUp],
    ['', 'hide', none],
    [undefined, 'hide', none],
    ['après-midi', 'hide', none],
    [' matin', 'hide', none],
  ])('%s gives %s and %s', (value, className, icon) => {
    expect(periodToClassName(value)).toEqual(className);
    expect(periodToIcon(value)).toEqual(icon);
  });
});

export function periodToClassName(value) {
  switch (toSingleLetter(value)) {
    case 'm':
      return 'dot-light';
    case 's':
      return 'dot-dark';
    case 'j':
      return 'dot-lighter';
    case 'n':
      return 'dot-darker';
    default:
      return 'hide';
  }
}

export function periodToIcon(value) {
  switch (toSingleLetter(value)) {
    case 'm':
      return 'weather-sunset-up';
    case 's':
      return 'weather-sunset-down';
    case 'j':
      return 'weather-sunny';
    case 'n':
      return 'weather-night';
    default:
      return 'weather-none';
  }
}

function toSingleLetter(value) {
  return value === undefined || value.length === 0
    ? undefined
    : value.toLowerCase()[0];
}

/**
 * The period a shot's `period` field names, from its first letter (French or English).
 * @returns {'morning' | 'day' | 'evening' | 'night' | undefined}
 */
export function toPeriod(value) {
  switch (toSingleLetter(value)) {
    case 'm':
      return 'morning';
    case 'j':
      return 'day';
    case 's':
      return 'evening';
    case 'n':
      return 'night';
    default:
      return undefined;
  }
}

function toSingleLetter(value) {
  return value === undefined || value.length === 0
    ? undefined
    : value.toLowerCase()[0];
}

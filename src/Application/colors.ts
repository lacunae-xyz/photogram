export const palette = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
];

/** `#rrggbb` in lower case, or undefined when it isn't a 3- or 6-digit hex colour. */
export function normalizeHex(color: string | undefined): string | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color?.trim() ?? '');
  if (!match) {
    return undefined;
  }
  const digits = match[1].toLowerCase();
  return digits.length === 3
    ? '#' + [...digits].map(digit => digit + digit).join('')
    : '#' + digits;
}

/** The first palette colour nobody uses. All used: the least used, lowest index on ties. */
export function nextColor(used: Iterable<string | undefined>): string {
  const normalizedPalette = palette.map(normalizeHex);
  const counts = palette.map(() => 0);
  for (const color of used) {
    const index = normalizedPalette.indexOf(normalizeHex(color));
    if (index !== -1) {
      counts[index]++;
    }
  }
  return palette[counts.indexOf(Math.min(...counts))];
}

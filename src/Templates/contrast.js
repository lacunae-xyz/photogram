import { normalizeHex } from '../Application/colors';

export default function getContrastYIQ(hexcolor) {
  const hex = normalizeHex(hexcolor) ?? hexcolor;
  var r = parseInt(hex.substring(1, 3), 16);
  var g = parseInt(hex.substring(3, 5), 16);
  var b = parseInt(hex.substring(5, 7), 16);
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 192 ? 'dark' : 'light';
}

/** Black or white, whichever has the higher WCAG contrast ratio on the colour. Undefined if it isn't a hex colour. */
export function blackOrWhite(hexcolor) {
  const hex = normalizeHex(hexcolor);
  if (!hex) {
    return undefined;
  }
  const [r, g, b] = [1, 3, 5].map(i => {
    const channel = parseInt(hex.substring(i, i + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Against black (L + 0.05) / 0.05, against white 1.05 / (L + 0.05): equal at L ≈ 0.179.
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? '#000000'
    : '#ffffff';
}

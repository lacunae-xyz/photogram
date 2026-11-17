import { normalizeHex } from '../Application/colors';

export default function getContrastYIQ(hexcolor) {
  const hex = normalizeHex(hexcolor) ?? hexcolor;
  var r = parseInt(hex.substring(1, 3), 16);
  var g = parseInt(hex.substring(3, 5), 16);
  var b = parseInt(hex.substring(5, 7), 16);
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 192 ? 'dark' : 'light';
}

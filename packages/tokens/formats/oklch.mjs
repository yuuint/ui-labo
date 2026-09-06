/**
 * OKLCH → sRGB。原本は OKLCH で書き、sRGB しか扱えない出力先で変換する
 * （spec `design-tokens` の「色空間」）。
 */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** oklch(L C H) / oklch(L C H / A) を [r,g,b,a] (0-1) にする */
export function parseOklch(str) {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i.exec(str.trim());
  if (!m) return null;
  const L = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const h = (parseFloat(m[3]) * Math.PI) / 180;
  const a = m[4] == null ? 1 : (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]));

  const A = C * Math.cos(h), B = C * Math.sin(h);
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.2914855480 * B;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;

  const r = +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s;
  return [clamp01(toSrgb(r)), clamp01(toSrgb(g)), clamp01(toSrgb(b)), a];
}

const hex2 = (v) => Math.round(v * 255).toString(16).padStart(2, "0");

/** "#rrggbb"（不透明なら 6 桁、半透明なら 8 桁） */
export function oklchToHex(str) {
  const rgba = parseOklch(str);
  if (!rgba) return str;
  const [r, g, b, a] = rgba;
  return "#" + hex2(r) + hex2(g) + hex2(b) + (a < 1 ? hex2(a) : "");
}

/** Flutter の Color リテラル（ARGB） */
export function oklchToDart(str) {
  const rgba = parseOklch(str);
  if (!rgba) return `const Color(0xFF000000) /* ${str} */`;
  const [r, g, b, a] = rgba;
  return `const Color(0x${(hex2(a) + hex2(r) + hex2(g) + hex2(b)).toUpperCase()})`;
}

/** SwiftUI の Color（sRGB） */
export function oklchToSwift(str) {
  const rgba = parseOklch(str);
  if (!rgba) return "Color.black";
  const [r, g, b, a] = rgba.map((v) => Math.round(v * 1000) / 1000);
  return `Color(.sRGB, red: ${r}, green: ${g}, blue: ${b}, opacity: ${a})`;
}

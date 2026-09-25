import type { CSSProperties } from "react";

// A per-artist accent from the CRM replaces the orange. global.css reads three variables:
//   --orange     the accent itself (bars, fills, borders)
//   --orange-hi  a lighter shade for hovers and highlights
//   --on-accent  text drawn on top of the accent (booking band, hovered chart rows, buttons)
// Anything that isn't a plain hex color is ignored, so the default orange stays.

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(value: string | null | undefined): [number, number, number] | null {
  const m = value?.trim().match(HEX);
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

// WCAG relative luminance.
function luminance([r, g, b]: number[]): number {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Same hue, 7 points lighter: the default orange #c24a0c -> close to its hover shade #e2600f.
function lighten([r, g, b]: number[], points = 7): number[] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
  }
  const l2 = Math.min(1, l + points / 100);
  const c = (1 - Math.abs(2 * l2 - 1)) * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l2 - c / 2;
  const [r1, g1, b1] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor((h + 6) % 6)];
  return [r1, g1, b1].map((v) => (v + m) * 255);
}

const WHITE = 1;
const INK = luminance([5, 5, 6]); // --bg

/** Inline CSS variables for an artist's accent color, or undefined to keep the default orange. */
export function accentStyle(color: string | null | undefined): CSSProperties | undefined {
  const rgb = parseHex(color);
  if (!rgb) return undefined;
  const lum = luminance(rgb);
  return {
    "--orange": toHex(rgb),
    "--orange-hi": toHex(lighten(rgb)),
    // Whichever of white or near-black reads better on the accent.
    "--on-accent": contrast(lum, WHITE) >= contrast(lum, INK) ? "#fff" : "#050506",
  };
}

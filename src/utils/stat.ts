export interface ParsedStat {
  pre: string;
  n: number;
  dec: number;
  sep: "," | ".";
  suf: string;
}

// Splits a stat like "9,7K" into prefix, number, and suffix so it can be counted up.
export function parseStat(s: string): ParsedStat | null {
  const m = s.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  const sep = m[2].includes(",") ? "," : ".";
  const dec = (m[2].split(/[.,]/)[1] || "").length;
  return { pre: m[1], n: parseFloat(m[2].replace(",", ".")), dec, sep, suf: m[3] };
}

export function formatStat(p: ParsedStat, v: number): string {
  return p.pre + v.toFixed(p.dec).replace(".", p.sep) + p.suf;
}

export function isPlaceholder(value: string): boolean {
  return /x{2,}/i.test(value);
}

export const easeOutQuart = (k: number): number => 1 - Math.pow(1 - k, 4);

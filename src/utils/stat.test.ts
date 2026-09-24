import { easeOutQuart, formatStat, isPlaceholder, parseStat as parseMaybe } from "./stat";

// Test helper: the inputs used below are always numeric.
const parseStat = (s: string) => parseMaybe(s)!;

describe("parseStat", () => {
  it("parses a plain number with suffix", () => {
    expect(parseStat("8K")).toEqual({ pre: "", n: 8, dec: 0, sep: ".", suf: "K" });
  });

  it("keeps a comma decimal separator", () => {
    expect(parseStat("9,7K")).toEqual({ pre: "", n: 9.7, dec: 1, sep: ",", suf: "K" });
  });

  it("handles prefixes and trailing symbols", () => {
    expect(parseStat("~30+")).toEqual({ pre: "~", n: 30, dec: 0, sep: ".", suf: "+" });
  });

  it("returns null when there is no number", () => {
    expect(parseMaybe("XX")).toBeNull();
    expect(parseMaybe("XXXk")).toBeNull();
  });
});

describe("formatStat", () => {
  it("round-trips a parsed value", () => {
    for (const s of ["8K", "9,7K", "30+", "1.25M"]) {
      const p = parseStat(s);
      expect(formatStat(p, p.n)).toBe(s);
    }
  });

  it("formats intermediate values with the same precision and separator", () => {
    expect(formatStat(parseStat("9,7K"), 4.26)).toBe("4,3K");
    expect(formatStat(parseStat("30+"), 12.6)).toBe("13+");
  });
});

describe("isPlaceholder", () => {
  it("flags runs of x", () => {
    expect(isPlaceholder("XX")).toBe(true);
    expect(isPlaceholder("xxxxx")).toBe(true);
    expect(isPlaceholder("8K")).toBe(false);
    expect(isPlaceholder("x1")).toBe(false);
  });
});

describe("easeOutQuart", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(easeOutQuart(0.5)).toBeGreaterThan(0.5);
  });
});

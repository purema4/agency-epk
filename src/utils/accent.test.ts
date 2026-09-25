import { accentStyle, parseHex } from "./accent";

describe("parseHex", () => {
  it.each([
    ["#c24a0c", [194, 74, 12]],
    ["C24A0C", [194, 74, 12]],
    [" #fa0 ", [255, 170, 0]],
  ])("reads %s", (value, rgb) => {
    expect(parseHex(value)).toEqual(rgb);
  });

  it.each(["", "orange", "#12345", "#gggggg", "red;color:blue", "#c24a0c80", undefined, null])(
    "rejects %s",
    (value) => {
      expect(parseHex(value)).toBeNull();
    }
  );
});

describe("accentStyle", () => {
  it("keeps the default orange when there's no valid color", () => {
    expect(accentStyle(undefined)).toBeUndefined();
    expect(accentStyle("not a color")).toBeUndefined();
  });

  it("sets the accent, a lighter hover shade, and readable text on top", () => {
    const style = accentStyle("#C24A0C")!;
    expect(style["--orange"]).toBe("#c24a0c");
    // Close to the hand-picked hover shade of the default orange (#e2600f).
    const hi = parseHex(String(style["--orange-hi"]))!;
    [226, 96, 15].forEach((c, i) => expect(Math.abs(hi[i] - c)).toBeLessThanOrEqual(12));
    expect(style["--on-accent"]).toBe("#fff");
  });

  it("switches to dark text on light accents", () => {
    expect(accentStyle("#ffe600")!["--on-accent"]).toBe("#050506");
    expect(accentStyle("#43f0e4")!["--on-accent"]).toBe("#050506");
    expect(accentStyle("#1a3cff")!["--on-accent"]).toBe("#fff");
  });

  // Hue in degrees, to check the hover shade stays the same color, only lighter.
  const hue = (hex: string) => {
    const [r, g, b] = parseHex(hex)!.map((c) => c / 255);
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };

  it.each(["#e0112b", "#ff00aa", "#c24a0c", "#ffe600", "#1fd1a5", "#0033ff", "#8a5cff", "#ff0000", "#b0107a"])(
    "gives %s a valid, lighter hover shade of the same hue",
    (color) => {
      const hi = String(accentStyle(color)!["--orange-hi"]);
      expect(hi).toMatch(/^#[0-9a-f]{6}$/);
      const diff = Math.abs(hue(hi) - hue(color));
      expect(Math.min(diff, 360 - diff)).toBeLessThan(2);
      const sum = (c: string) => parseHex(c)!.reduce((a, b) => a + b);
      expect(sum(hi)).toBeGreaterThan(sum(color));
    }
  );

  it("works for greys (no hue)", () => {
    expect(accentStyle("#808080")!["--orange-hi"]).toBe("#929292");
  });
});

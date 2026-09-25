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

  it("works for greys (no hue)", () => {
    expect(accentStyle("#808080")!["--orange-hi"]).toBe("#929292");
  });
});

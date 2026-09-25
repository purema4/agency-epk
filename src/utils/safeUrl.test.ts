import { isEmail, safeUrl } from "./safeUrl";

describe("safeUrl", () => {
  it("keeps web links, absolute or relative", () => {
    expect(safeUrl("https://open.spotify.com/track/1")).toBe("https://open.spotify.com/track/1");
    expect(safeUrl("http://example.com")).toBe("http://example.com");
    expect(safeUrl("/epk?artist=nova")).toBe("/epk?artist=nova");
    expect(safeUrl("#")).toBe("#");
  });

  it("drops script and data links, however they're disguised", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "java\tscript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
    ]) {
      expect(safeUrl(url)).toBeUndefined();
    }
  });

  it("drops empty and unparseable values", () => {
    expect(safeUrl("")).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
    expect(safeUrl("http://[bad")).toBeUndefined();
  });
});

describe("isEmail", () => {
  it("accepts a plain address", () => {
    expect(isEmail("bookings@berlinrecords.world")).toBe(true);
    expect(isEmail("jane.doe+epk@mail.example.co.uk")).toBe(true);
  });

  it("rejects anything that would add mailto: parameters or isn't an address", () => {
    expect(isEmail("a@b.com?bcc=x@evil.com")).toBe(false);
    expect(isEmail("a@b.com&body=hi")).toBe(false);
    expect(isEmail("a b@c.com")).toBe(false);
    expect(isEmail("not-an-email")).toBe(false);
  });
});

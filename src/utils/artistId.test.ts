import { DEFAULT_ARTIST_ID, getArtistId, isArtistId } from "./artistId";

describe("getArtistId", () => {
  it("reads ?artist= from the URL", () => {
    expect(getArtistId("?artist=nova")).toBe("nova");
    expect(getArtistId("?x=1&artist=%20nova%20")).toBe("nova");
  });

  it("falls back to the default artist", () => {
    expect(DEFAULT_ARTIST_ID).toBe("ariovistus");
    expect(getArtistId("")).toBe("ariovistus");
    expect(getArtistId("?artist=")).toBe("ariovistus");
  });
});

describe("isArtistId", () => {
  it("matches the backend's rule", () => {
    expect(isArtistId("ariovistus")).toBe(true);
    expect(isArtistId("Dax_Orbit-2")).toBe(true);
    expect(isArtistId("")).toBe(false);
    expect(isArtistId("..")).toBe(false);
    expect(isArtistId("a/b")).toBe(false);
    expect(isArtistId("x".repeat(65))).toBe(false);
  });
});

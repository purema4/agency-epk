import { DEFAULT_ARTIST_ID, getArtistId } from "./artistId";

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

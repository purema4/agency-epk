import { http, HttpResponse } from "msw";
import crmSample from "../../backend/mock_data/ariovistus.json";
import { ariovistus } from "../mocks/fixtures";
import { server } from "../mocks/node";
import { ApiError, apiUrl, createApiConfig } from "./client";
import { fetchEpk, isEpk } from "./epk";

const route = "*/artists/:id/epk";
const api = createApiConfig("/api"); // real network path, intercepted by MSW

describe("apiUrl", () => {
  it("resolves paths against a relative base on the current origin", () => {
    expect(apiUrl("/api", "artists/x/epk")).toBe(`${window.location.origin}/api/artists/x/epk`);
    expect(apiUrl("/api/", "/artists/x/epk")).toBe(`${window.location.origin}/api/artists/x/epk`);
  });

  it("keeps the path of an absolute base URL", () => {
    expect(apiUrl("https://crm.example.com/v1", "artists/x/epk")).toBe("https://crm.example.com/v1/artists/x/epk");
  });
});

describe("createApiConfig", () => {
  it("uses the network when given a URL, the built-in mock otherwise", () => {
    expect(createApiConfig("https://crm.example.com").baseUrl).toBe("https://crm.example.com");
    expect(createApiConfig("https://crm.example.com").fetch).not.toBe(createApiConfig().fetch);
    expect(createApiConfig(null).baseUrl).toBe("/api");
  });
});

describe("fetchEpk", () => {
  it("returns the artist's press kit", async () => {
    await expect(fetchEpk(api, "ariovistus")).resolves.toEqual(ariovistus);
  });

  it("URL-encodes the artist id", async () => {
    let requested = "";
    server.use(
      http.get(route, ({ request }) => {
        requested = new URL(request.url).pathname;
        return HttpResponse.json(ariovistus);
      })
    );
    await fetchEpk(api, "dj a/b");
    expect(requested).toBe("/api/artists/dj%20a%2Fb/epk");
  });

  it("throws a 404 ApiError for an unknown artist", async () => {
    const err = await fetchEpk(api, "nobody").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Artist not found", status: 404 });
  });

  it("throws on server errors", async () => {
    server.use(http.get(route, () => new HttpResponse(null, { status: 500 })));
    await expect(fetchEpk(api, "ariovistus")).rejects.toMatchObject({ message: "Request failed (500)", status: 500 });
  });

  it("throws when the network fails", async () => {
    server.use(http.get(route, () => HttpResponse.error()));
    await expect(fetchEpk(api, "ariovistus")).rejects.toThrow("Could not reach the server");
  });

  it("rejects a response that isn't a press kit", async () => {
    server.use(http.get(route, () => HttpResponse.json({ name: "ARIOVISTUS" })));
    await expect(fetchEpk(api, "ariovistus")).rejects.toThrow("The server returned an invalid press kit");
  });
});

describe("isEpk", () => {
  it("accepts what the backend serves (contract with backend/mock_data)", () => {
    expect(isEpk(crmSample)).toBe(true);
  });

  it("accepts a complete press kit, with or without the extra bio", () => {
    expect(isEpk(ariovistus)).toBe(true);
    expect(isEpk({ ...ariovistus, bio: { short: "Hi" } })).toBe(true);
  });

  it.each([
    ["null", null],
    ["missing photo", { ...ariovistus, photo: undefined }],
    ["non-string tag", { ...ariovistus, tags: ["ok", 3] }],
    ["bad stat", { ...ariovistus, stats: [{ value: 8 }] }],
    ["bad chart", { ...ariovistus, charts: [{ title: "x" }] }],
    ["non-string contact", { ...ariovistus, booking: { ...ariovistus.booking, contact: 1 } }],
    ["missing booking email", { ...ariovistus, booking: { ...ariovistus.booking, email: undefined } }],
  ])("rejects %s", (_, value) => {
    expect(isEpk(value)).toBe(false);
  });
});

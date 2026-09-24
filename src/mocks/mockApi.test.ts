import { ariovistus } from "./fixtures";
import { createMockFetch } from "./mockApi";

const mockFetch = createMockFetch(0);

describe("in-app mock API", () => {
  it("serves an artist's press kit", async () => {
    const res = await mockFetch("https://anything.example/api/artists/ARIOVISTUS/epk");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(JSON.parse(JSON.stringify(ariovistus)));
  });

  it("resolves relative URLs and returns 404 for unknown artists or paths", async () => {
    expect((await mockFetch("/api/artists/nobody/epk")).status).toBe(404);
    expect((await mockFetch("/api/unknown")).status).toBe(404);
  });

  it("can be aborted while waiting", async () => {
    const slow = createMockFetch(10_000);
    const ctrl = new AbortController();
    const pending = slow("/api/artists/ariovistus/epk", { signal: ctrl.signal });
    ctrl.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});

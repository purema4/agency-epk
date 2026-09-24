import type { Epk } from "../types";
import { ariovistus } from "./fixtures";

// In-memory "CRM": artist id -> press kit.
export const artists: Record<string, Epk> = { ariovistus };

export function epkResponse(artistId: string): Response {
  const artist = artists[artistId.toLowerCase()];
  return artist ? Response.json(artist) : Response.json({ error: "Artist not found" }, { status: 404 });
}

function wait(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    if (signal?.aborted) return abort();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), abort()), { once: true });
  });
}

/** A fetch() that answers GET .../artists/:id/epk from the sample data after a short delay. */
export function createMockFetch(latencyMs = 400): typeof fetch {
  return async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
    await wait(latencyMs, init?.signal);
    const m = url.pathname.match(/\/artists\/([^/]+)\/epk\/?$/);
    return m ? epkResponse(decodeURIComponent(m[1])) : Response.json({ error: "Not found" }, { status: 404 });
  };
}

export const mockFetch = createMockFetch();

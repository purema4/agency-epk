export interface ApiConfig {
  /** Base URL of the artist API / CRM, e.g. https://crm.example.com/v1 */
  baseUrl: string;
  fetch: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Late-bound so test interceptors (MSW) patching globalThis.fetch still apply.
export const networkFetch: typeof fetch = (input, init) => fetch(input, init);

// Serves sample data in-process. Loaded on demand so the sample photo stays out of the main bundle.
// (A service worker can't be used: GoDaddy pages would need it served from their own domain.)
export const mockFetch: typeof fetch = async (input, init) => (await import("../mocks/mockApi")).mockFetch(input, init);

/** A real API when a URL is given, otherwise the built-in mock. */
export function createApiConfig(apiUrl?: string | null): ApiConfig {
  return apiUrl ? { baseUrl: apiUrl, fetch: networkFetch } : { baseUrl: "/api", fetch: mockFetch };
}

export function apiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\//, ""), new URL(base, window.location.origin)).toString();
}

export async function getJson<T>(api: ApiConfig, path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await api.fetch(apiUrl(api.baseUrl, path), { headers: { Accept: "application/json" }, signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Could not reach the server");
  }
  if (!res.ok) {
    throw new ApiError(res.status === 404 ? "Artist not found" : `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

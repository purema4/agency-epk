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

// Relative bases resolve against document.baseURI, not location.origin: GoDaddy runs custom code
// in a srcdoc iframe, where location.origin is "null" (an invalid base, so new URL() would throw
// before any request is made) while baseURI is the host page's URL.
export function apiUrl(baseUrl: string, path: string, documentBase: string = document.baseURI): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\//, ""), new URL(base, documentBase)).toString();
}

export async function getJson<T>(api: ApiConfig, path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    // The API is public: never send the host site's cookies or HTTP auth along.
    res = await api.fetch(apiUrl(api.baseUrl, path), {
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Could not reach the server");
  }
  if (!res.ok) {
    throw new ApiError(res.status === 404 ? "Artist not found" : `Request failed (${res.status})`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    // e.g. an HTML error page from a proxy: show a clean message, not the parser's.
    throw new ApiError("The server returned an invalid response");
  }
}

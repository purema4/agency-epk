// Same rule as the backend (ArtistId in backend/app/main.py). Anything else is never requested:
// ".." for one would survive encodeURIComponent and resolve to a different API path.
export const isArtistId = (id: string): boolean => /^[A-Za-z0-9_-]{1,64}$/.test(id);

export const DEFAULT_ARTIST_ID = import.meta.env.VITE_ARTIST_ID || "ariovistus";

// ?artist=<id> in the page URL picks which artist to load.
export function getArtistId(search: string = window.location.search): string {
  return new URLSearchParams(search).get("artist")?.trim() || DEFAULT_ARTIST_ID;
}

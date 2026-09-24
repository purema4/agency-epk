export const DEFAULT_ARTIST_ID = import.meta.env.VITE_ARTIST_ID || "ariovistus";

// ?artist=<id> in the page URL picks which artist to load.
export function getArtistId(search: string = window.location.search): string {
  return new URLSearchParams(search).get("artist")?.trim() || DEFAULT_ARTIST_ID;
}

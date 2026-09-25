import type { Roster, RosterArtist } from "../types";
import { ApiError, getJson, type ApiConfig } from "./client";

// Fetches every published artist for the <artist-roster> mosaic.
export async function fetchRoster(api: ApiConfig, signal?: AbortSignal): Promise<Roster> {
  const data = await getJson<unknown>(api, "artists", signal);
  if (!isRoster(data)) throw new ApiError("The server returned an invalid artist list");
  return data;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string";

const isRosterArtist = (v: unknown): v is RosterArtist =>
  isObj(v) && isStr(v.id) && isStr(v.name) && isObj(v.photo) && isStr(v.photo.src) && isStr(v.photo.alt);

export const isRoster = (v: unknown): v is Roster =>
  isObj(v) && Array.isArray(v.artists) && v.artists.every(isRosterArtist);

import type { ChartEntry, Epk } from "../types";
import { ApiError, getJson, type ApiConfig } from "./client";

// Fetches an artist's press kit. If the CRM returns a different shape,
// map its fields to `Epk` here so the components stay unchanged.
export async function fetchEpk(api: ApiConfig, artistId: string, signal?: AbortSignal): Promise<Epk> {
  const data = await getJson<unknown>(api, `artists/${encodeURIComponent(artistId)}/epk`, signal);
  if (!isEpk(data)) throw new ApiError("The server returned an invalid press kit");
  return data;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string";
const optStr = (v: unknown) => v === undefined || isStr(v);
const arrOf = <T>(v: unknown, check: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(check);
const hasStrings =
  <K extends string>(...keys: K[]) =>
  (v: unknown): v is Record<K, string> =>
    isObj(v) && keys.every((k) => isStr(v[k]));

const isChartEntry = (v: unknown): v is ChartEntry =>
  hasStrings("title", "label", "position")(v) && optStr((v as { url?: unknown }).url);

// Shallow runtime check so a malformed response shows the error screen instead of crashing a component.
export function isEpk(v: unknown): v is Epk {
  if (!isObj(v)) return false;
  const { photo, tags, platforms, stats, bio, charts, booking } = v;
  return (
    ["name", "label", "kicker", "lede"].every((k) => isStr(v[k])) &&
    hasStrings("src", "alt")(photo) &&
    arrOf(tags, isStr) &&
    arrOf(platforms, hasStrings("name", "url")) &&
    arrOf(stats, hasStrings("value", "label")) &&
    isObj(bio) &&
    isStr(bio.short) &&
    (bio.extra === undefined || isStr(bio.extra)) &&
    arrOf(charts, isChartEntry) &&
    isObj(booking) &&
    (booking.contact === undefined || isStr(booking.contact)) &&
    hasStrings("email", "agencyUrl", "agencyLabel")(booking)
  );
}

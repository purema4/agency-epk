import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiConfig } from "../api/client";
import { useApi } from "../api/context";
import { fetchEpk } from "../api/epk";

export const epkQuery = (api: ApiConfig, artistId: string) =>
  queryOptions({
    queryKey: ["epk", api.baseUrl, artistId],
    queryFn: ({ signal }) => fetchEpk(api, artistId, signal),
    enabled: !!artistId,
    staleTime: 5 * 60 * 1000,
  });

export function useEpk(artistId: string) {
  return useQuery(epkQuery(useApi(), artistId));
}

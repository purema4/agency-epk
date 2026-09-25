import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiConfig } from "../api/client";
import { useApi } from "../api/context";
import { fetchRoster } from "../api/roster";

export const rosterQuery = (api: ApiConfig) =>
  queryOptions({
    queryKey: ["roster", api.baseUrl],
    queryFn: ({ signal }) => fetchRoster(api, signal),
    staleTime: 5 * 60 * 1000,
  });

export function useRoster() {
  return useQuery(rosterQuery(useApi()));
}

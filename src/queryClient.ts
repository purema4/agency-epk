import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api/client";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry network/server errors, but not a 4xx like "artist not found".
        retry: (count, err) => !(err instanceof ApiError && err.status && err.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

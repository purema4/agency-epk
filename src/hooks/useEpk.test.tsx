import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ariovistus } from "../mocks/fixtures";
import { testQueryClient } from "../test/utils";
import { useEpk } from "./useEpk";

describe("useEpk", () => {
  it("loads and caches the press kit under ['epk', baseUrl, artistId]", async () => {
    const client = testQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEpk("ariovistus"), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ariovistus);
    expect(client.getQueryData(["epk", "/api", "ariovistus"])).toEqual(ariovistus);
  });
});

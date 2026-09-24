import { ApiError } from "./api/client";
import { createQueryClient } from "./queryClient";

const retry = createQueryClient().getDefaultOptions().queries!.retry as (n: number, e: unknown) => boolean;

describe("query retry policy", () => {
  it("does not retry client errors like 404", () => {
    expect(retry(0, new ApiError("Artist not found", 404))).toBe(false);
  });

  it("retries server and network errors up to twice", () => {
    for (const err of [new ApiError("down", 503), new ApiError("offline"), new Error("boom")]) {
      expect(retry(0, err)).toBe(true);
      expect(retry(1, err)).toBe(true);
      expect(retry(2, err)).toBe(false);
    }
  });
});

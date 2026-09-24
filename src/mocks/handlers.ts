import { delay, http } from "msw";
import { epkResponse } from "./mockApi";

// Same sample data as the in-app mock, served over the (intercepted) network in tests.
export const handlers = [
  http.get("*/artists/:artistId/epk", async ({ params }) => {
    await delay();
    return epkResponse(String(params.artistId));
  }),
];

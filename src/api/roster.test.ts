import { http, HttpResponse } from "msw";
import { ariovistus } from "../mocks/fixtures";
import { server } from "../mocks/node";
import { createApiConfig } from "./client";
import { fetchRoster, isRoster } from "./roster";

const card = { id: "ariovistus", name: ariovistus.name, photo: ariovistus.photo };

describe("fetchRoster", () => {
  it("loads GET /artists", async () => {
    expect(await fetchRoster(createApiConfig("/api"))).toEqual({ artists: [card] });
  });

  it("rejects a malformed answer", async () => {
    server.use(http.get("*/artists", () => HttpResponse.json([card])));
    await expect(fetchRoster(createApiConfig("/api"))).rejects.toThrow("invalid artist list");
  });
});

describe("isRoster", () => {
  it.each([
    ["a roster", { artists: [card] }, true],
    ["an empty roster", { artists: [] }, true],
    ["a bare array", [card], false],
    ["a card without photo", { artists: [{ id: "x", name: "X" }] }, false],
    ["a numeric id", { artists: [{ ...card, id: 1 }] }, false],
  ])("%s -> %s", (_, value, ok) => {
    expect(isRoster(value)).toBe(ok);
  });
});

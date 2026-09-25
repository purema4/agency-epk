import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ariovistus } from "../mocks/fixtures";
import { artists } from "../mocks/mockApi";
import { server } from "../mocks/node";
import { renderWithQuery } from "../test/utils";
import { ApiProvider } from "../api/context";
import { createApiConfig } from "../api/client";
import Roster, { artistHref } from "./Roster";

const api = createApiConfig("/api"); // network path, served by MSW from the sample artists

const renderRoster = (hrefTemplate?: string) =>
  renderWithQuery(
    <ApiProvider value={api}>
      <Roster hrefTemplate={hrefTemplate} />
    </ApiProvider>
  );

beforeEach(() => {
  artists.nova = { ...ariovistus, name: "NOVA", photo: { src: "/nova.jpg", alt: "Nova on stage" } };
});
afterEach(() => {
  delete artists.nova;
});

describe("Roster", () => {
  it("shows a tile with photo and name per artist, in order", async () => {
    renderRoster();
    expect(screen.getByRole("status")).toHaveAccessibleName("Loading artists");

    const list = await screen.findByRole("list", { name: "Artists" });
    const tiles = within(list).getAllByRole("listitem");
    expect(tiles.map((t) => t.textContent)).toEqual(["ARIOVISTUS", "NOVA"]);
    expect(within(tiles[1]).getByRole("img", { name: "Nova on stage" })).toHaveAttribute("src", "/nova.jpg");
    expect(screen.queryByRole("link")).not.toBeInTheDocument(); // no href-template, no links
  });

  it("links each tile through href-template, in the whole window", async () => {
    renderRoster("https://berlinrecords.info/epk?artist={id}");
    const link = await screen.findByRole("link", { name: "NOVA" });
    expect(link).toHaveAttribute("href", "https://berlinrecords.info/epk?artist=nova");
    expect(link).toHaveAttribute("target", "_top");
  });

  it("says so when there are no artists", async () => {
    server.use(http.get("*/artists", () => HttpResponse.json({ artists: [] })));
    renderRoster();
    expect(await screen.findByText("No artists yet.")).toBeInTheDocument();
  });

  it("shows an error with a retry button when the API fails", async () => {
    server.use(http.get("*/artists", () => new HttpResponse(null, { status: 502 })));
    renderRoster();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn’t load the artists");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("artistHref", () => {
  it("fills in the (URL-encoded) id, or gives no link without a template", () => {
    expect(artistHref("/epk/{id}", "a b")).toBe("/epk/a%20b");
    expect(artistHref(null, "x")).toBeNull();
  });

  it("gives no link for a template that isn't a web link", () => {
    expect(artistHref("javascript:alert('{id}')", "x")).toBeNull();
  });
});

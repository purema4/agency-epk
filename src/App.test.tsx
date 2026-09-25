import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import App, { MISSING_ARTIST_MESSAGE } from "./App";
import { ariovistus } from "./mocks/fixtures";
import { artists } from "./mocks/mockApi";
import { server } from "./mocks/node";
import { renderWithQuery } from "./test/utils";

describe("App", () => {
  it("shows a loader, then the artist loaded from the API", async () => {
    renderWithQuery(<App artistId="ariovistus" syncDocumentTitle />);
    expect(screen.getByRole("status", { name: "Loading press kit" })).toBeInTheDocument();

    expect(await screen.findByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument();
    expect(screen.queryByText("Loading press kit…")).not.toBeInTheDocument();
    expect(document.title).toBe("ARIOVISTUS · TALENT - EPK - 2026");
  });

  it("uses the artist's accent color, or keeps the default orange", async () => {
    artists.nova = { ...ariovistus, name: "NOVA", accentColor: "#ffe600" };
    try {
      const { container, unmount } = renderWithQuery(<App artistId="nova" />);
      await screen.findByRole("heading", { level: 1, name: "NOVA" });
      const root = container.querySelector<HTMLElement>(".epk")!;
      expect(root.style.getPropertyValue("--orange")).toBe("#ffe600");
      expect(root.style.getPropertyValue("--on-accent")).toBe("#050506"); // dark text on yellow
      unmount();

      const plain = renderWithQuery(<App artistId="ariovistus" />);
      await screen.findByRole("heading", { level: 1, name: "ARIOVISTUS" });
      expect(plain.container.querySelector<HTMLElement>(".epk")!.style.getPropertyValue("--orange")).toBe("");
    } finally {
      delete artists.nova;
    }
  });

  it("renders whatever artist the CRM returns", async () => {
    artists.nova = { ...ariovistus, name: "NOVA", tags: ["HARD TECHNO"], charts: [] };
    try {
      renderWithQuery(<App artistId="nova" />);
      expect(await screen.findByRole("heading", { level: 1, name: "NOVA" })).toBeInTheDocument();
      expect(screen.getByText("HARD TECHNO")).toBeInTheDocument();
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    } finally {
      delete artists.nova;
    }
  });

  it("shows an error for an unknown artist", async () => {
    renderWithQuery(<App artistId="nobody" />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn’t load the press kit");
    expect(alert).toHaveTextContent("Artist not found");
  });

  it("recovers when the user retries after a server error", async () => {
    const user = userEvent.setup();
    server.use(http.get("*/artists/:id/epk", () => new HttpResponse(null, { status: 503 }), { once: true }));
    renderWithQuery(<App artistId="ariovistus" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Request failed (503)");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("leaves the host page title alone by default (embedded)", async () => {
    document.title = "Host page";
    renderWithQuery(<App artistId="ariovistus" />);
    await screen.findByRole("heading", { level: 1, name: "ARIOVISTUS" });
    expect(document.title).toBe("Host page");
  });

  it("asks for an artist id instead of calling the API when none is given", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithQuery(<App artistId="" />);
    expect(screen.getByRole("alert")).toHaveTextContent(MISSING_ARTIST_MESSAGE);
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

import { act, screen, waitFor, within } from "@testing-library/react";
import { ariovistus } from "../mocks/fixtures";
import { artists } from "../mocks/mockApi";
import { FONTS_HREF, TAG_NAME } from "./index";

// Queries scoped to the component's shadow DOM.
const shadow = (el: HTMLElement) => within(el.shadowRoot as unknown as HTMLElement);

function mount(attrs: Record<string, string>) {
  const el = document.createElement(TAG_NAME);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  act(() => document.body.append(el));
  return el;
}

afterEach(() => {
  act(() => document.body.replaceChildren());
  document.head.querySelectorAll("link").forEach((l) => l.remove());
});

describe("<artist-epk>", () => {
  it("is registered as a custom element", () => {
    expect(customElements.get(TAG_NAME)).toBeDefined();
  });

  it("loads the artist named by its artist-id prop into shadow DOM", async () => {
    const el = mount({ "artist-id": "ariovistus", "api-url": "/api" });
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.querySelector("style")).not.toBeNull();

    expect(await shadow(el).findByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument();
    // Rendered inside the component, not the host page.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("uses the built-in sample data when no api-url is given", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const el = mount({ "artist-id": "ariovistus" });
    expect(await shadow(el).findByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reloads when the artist-id prop changes", async () => {
    artists.nova = { ...ariovistus, name: "NOVA" };
    try {
      const el = mount({ "artist-id": "ariovistus", "api-url": "/api" });
      await shadow(el).findByRole("heading", { level: 1, name: "ARIOVISTUS" });

      act(() => {
        el.artistId = "nova";
      });
      expect(el.getAttribute("artist-id")).toBe("nova");
      expect(await shadow(el).findByRole("heading", { level: 1, name: "NOVA" })).toBeInTheDocument();
    } finally {
      delete artists.nova;
    }
  });

  it("explains what to do when artist-id is missing", () => {
    const el = mount({});
    expect(shadow(el).getByRole("alert")).toHaveTextContent("Add an artist-id");
  });

  it("shows the API error for an unknown artist", async () => {
    const el = mount({ "artist-id": "nobody", "api-url": "/api" });
    expect(await shadow(el).findByRole("alert")).toHaveTextContent("Artist not found");
  });

  it("adds the web fonts to the page once, however many instances there are", () => {
    mount({ "artist-id": "ariovistus" });
    mount({ "artist-id": "ariovistus" });
    const links = document.head.querySelectorAll<HTMLLinkElement>("link[data-artist-epk-fonts]");
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe(new URL(FONTS_HREF).href);
  });

  it("unmounts cleanly and can be re-attached", async () => {
    const el = mount({ "artist-id": "ariovistus", "api-url": "/api" });
    await shadow(el).findByRole("heading", { level: 1, name: "ARIOVISTUS" });

    act(() => el.remove());
    await waitFor(() => expect(el.shadowRoot!.querySelector(".epk")).toBeNull());

    act(() => document.body.append(el));
    expect(await shadow(el).findByRole("heading", { level: 1, name: "ARIOVISTUS" })).toBeInTheDocument();
  });
});

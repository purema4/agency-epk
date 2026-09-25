import { act, within } from "@testing-library/react";
import { ROSTER_TAG_NAME } from "./roster";
import "./index"; // the published script registers both components

const shadow = (el: HTMLElement) => within(el.shadowRoot as unknown as HTMLElement);

function mount(attrs: Record<string, string>) {
  const el = document.createElement(ROSTER_TAG_NAME);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  act(() => document.body.append(el));
  return el;
}

afterEach(() => {
  act(() => document.body.replaceChildren());
  document.head.querySelectorAll("link").forEach((l) => l.remove());
});

describe("<artist-roster>", () => {
  it("is registered by the same script as <artist-epk>", () => {
    expect(customElements.get(ROSTER_TAG_NAME)).toBeDefined();
    expect(customElements.get("artist-epk")).toBeDefined();
  });

  it("renders the mosaic in its shadow DOM", async () => {
    const el = mount({ "api-url": "/api" });
    expect(await shadow(el).findByRole("list", { name: "Artists" })).toBeInTheDocument();
    expect(el.shadowRoot!.querySelector("style")).not.toBeNull(); // CSS text is stubbed out in tests
    expect(document.head.querySelector("link[data-artist-epk-fonts]")).not.toBeNull();
  });

  it("links tiles once href-template is set", async () => {
    const el = mount({ "api-url": "/api" });
    await shadow(el).findByRole("list", { name: "Artists" });
    expect(shadow(el).queryByRole("link")).not.toBeInTheDocument();

    act(() => {
      el.hrefTemplate = "/epk?artist={id}";
    });
    expect(await shadow(el).findByRole("link", { name: "ARIOVISTUS" })).toHaveAttribute(
      "href",
      "/epk?artist=ariovistus"
    );
  });
});

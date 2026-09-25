// What <artist-epk> and <artist-roster> have in common: a shadow root with their CSS, the web
// fonts, one React root, the API config and a shared query cache.
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createApiConfig } from "../api/client";
import { ApiProvider } from "../api/context";
import { createQueryClient } from "../queryClient";
import { fitFrameToContent } from "./fitFrame";

export const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Anton&family=Lexend:wght@300;400;500;700&display=swap";

// One cache for every component on the page.
const queryClient = createQueryClient();

// @font-face rules are ignored inside shadow DOM, so fonts go in the document head (once).
function ensureFonts(doc: Document) {
  if (doc.querySelector("link[data-artist-epk-fonts]")) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = FONTS_HREF;
  link.dataset.artistEpkFonts = "";
  doc.head.append(link);
}

export abstract class ReactShadowElement extends HTMLElement {
  #root: Root | null = null;
  #mount: HTMLDivElement | null = null;

  /** The component's CSS, put inside its shadow root. */
  protected abstract get css(): string;
  /** What to render, from the current attributes. */
  protected abstract content(): ReactNode;

  get apiUrl(): string | null {
    return this.getAttribute("api-url")?.trim() || null;
  }
  set apiUrl(value: string | null) {
    if (value) this.setAttribute("api-url", value);
    else this.removeAttribute("api-url");
  }

  connectedCallback() {
    if (!this.#mount) {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = this.css;
      this.#mount = document.createElement("div");
      shadow.replaceChildren(style, this.#mount);
    }
    ensureFonts(this.ownerDocument);
    fitFrameToContent(this.ownerDocument.defaultView);
    this.#root ??= createRoot(this.#mount);
    this.render();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = null;
  }

  attributeChangedCallback() {
    this.render();
  }

  protected render() {
    this.#root?.render(
      <StrictMode>
        <ApiProvider value={createApiConfig(this.apiUrl ?? import.meta.env.VITE_API_URL)}>
          <QueryClientProvider client={queryClient}>{this.content()}</QueryClientProvider>
        </ApiProvider>
      </StrictMode>
    );
  }
}

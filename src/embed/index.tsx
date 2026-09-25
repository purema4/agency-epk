// <artist-epk> web component: the GoDaddy "Custom code" entry point.
//
//   <artist-epk artist-id="ariovistus"></artist-epk>
//   <script type="module" src="https://YOUR-HOST/artist-epk.js"></script>
//
// Attributes (the component's props):
//   artist-id  required  which artist to load from the API / CRM
//   api-url    optional  API base URL; defaults to VITE_API_URL at build time, else built-in sample data
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createApiConfig } from "../api/client";
import { ApiProvider } from "../api/context";
import App from "../App";
import { createQueryClient } from "../queryClient";
import { fitFrameToContent } from "./fitFrame";
import baseCss from "../styles/global.css?inline";
import embedCss from "./embed.css?inline";

export const TAG_NAME = "artist-epk";
export const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Anton&family=Lexend:wght@300;400;500;700&display=swap";

// One cache for every <artist-epk> on the page.
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

export class ArtistEpkElement extends HTMLElement {
  static observedAttributes = ["artist-id", "api-url"];

  #root: Root | null = null;
  #mount: HTMLDivElement | null = null;

  get artistId(): string {
    return this.getAttribute("artist-id")?.trim() ?? "";
  }
  set artistId(value: string) {
    this.setAttribute("artist-id", value);
  }

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
      style.textContent = `${baseCss}\n${embedCss}`;
      this.#mount = document.createElement("div");
      shadow.replaceChildren(style, this.#mount);
    }
    ensureFonts(this.ownerDocument);
    fitFrameToContent(this.ownerDocument.defaultView);
    this.#root ??= createRoot(this.#mount);
    this.#render();
  }

  disconnectedCallback() {
    this.#root?.unmount();
    this.#root = null;
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.#root?.render(
      <StrictMode>
        <ApiProvider value={createApiConfig(this.apiUrl ?? import.meta.env.VITE_API_URL)}>
          <QueryClientProvider client={queryClient}>
            <App artistId={this.artistId} />
          </QueryClientProvider>
        </ApiProvider>
      </StrictMode>
    );
  }
}

if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, ArtistEpkElement);

declare global {
  interface HTMLElementTagNameMap {
    [TAG_NAME]: ArtistEpkElement;
  }
}

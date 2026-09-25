// The GoDaddy "Custom code" entry point. One script registers both web components:
//
//   <artist-epk artist-id="ariovistus"></artist-epk>          one artist's press kit
//   <artist-roster></artist-roster>                           mosaic of every artist (see ./roster.tsx)
//   <script type="module" src="https://YOUR-HOST/artist-epk.js"></script>
//
// <artist-epk> attributes (the component's props):
//   artist-id  required  which artist to load from the API / CRM
//   api-url    optional  API base URL; defaults to VITE_API_URL at build time, else built-in sample data
import App from "../App";
import baseCss from "../styles/global.css?inline";
import embedCss from "./embed.css?inline";
import { ReactShadowElement } from "./shared";
import "./roster";

export { FONTS_HREF } from "./shared";
export const TAG_NAME = "artist-epk";

export class ArtistEpkElement extends ReactShadowElement {
  static observedAttributes = ["artist-id", "api-url"];

  get artistId(): string {
    return this.getAttribute("artist-id")?.trim() ?? "";
  }
  set artistId(value: string) {
    this.setAttribute("artist-id", value);
  }

  protected get css() {
    return `${baseCss}\n${embedCss}`;
  }

  protected content() {
    return <App artistId={this.artistId} />;
  }
}

if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, ArtistEpkElement);

declare global {
  interface HTMLElementTagNameMap {
    [TAG_NAME]: ArtistEpkElement;
  }
}

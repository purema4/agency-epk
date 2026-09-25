// <artist-roster> web component: a mosaic of every published artist, for the main agency page.
//
//   <artist-roster href-template="https://berlinrecords.info/epk?artist={id}"></artist-roster>
//   <script type="module" src="https://YOUR-HOST/artist-epk.js"></script>
//
// Attributes (the component's props):
//   href-template  optional  where a tile links to; {id} becomes the artist id. No links when unset.
//   api-url        optional  API base URL; defaults to VITE_API_URL at build time, else built-in sample data
import Roster from "../components/Roster";
import baseCss from "../styles/global.css?inline";
import rosterCss from "../styles/roster.css?inline";
import embedCss from "./embed.css?inline";
import { ReactShadowElement } from "./shared";

export const ROSTER_TAG_NAME = "artist-roster";

export class ArtistRosterElement extends ReactShadowElement {
  static observedAttributes = ["href-template", "api-url"];

  get hrefTemplate(): string | null {
    return this.getAttribute("href-template")?.trim() || null;
  }
  set hrefTemplate(value: string | null) {
    if (value) this.setAttribute("href-template", value);
    else this.removeAttribute("href-template");
  }

  protected get css() {
    return `${baseCss}\n${rosterCss}\n${embedCss}`;
  }

  protected content() {
    return <Roster hrefTemplate={this.hrefTemplate} />;
  }
}

if (!customElements.get(ROSTER_TAG_NAME)) customElements.define(ROSTER_TAG_NAME, ArtistRosterElement);

declare global {
  interface HTMLElementTagNameMap {
    [ROSTER_TAG_NAME]: ArtistRosterElement;
  }
}

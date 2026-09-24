/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the artist API / CRM. When unset, requests go to /api and are served by the mock. */
  readonly VITE_API_URL?: string;
  /** Artist shown when the URL has no ?artist= parameter. */
  readonly VITE_ARTIST_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

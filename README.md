# Artist EPK

Electronic press kit for Berlin Records artists: a React + TypeScript page, shipped as the
`<artist-epk>` web component for GoDaddy, with a FastAPI backend that reads the CRM.

```
src/            React app + <artist-epk> / <artist-roster> web components (src/embed)
backend/        FastAPI API that queries the CRM (see backend/README.md)
embed-public/   Files deployed next to the embed script (Cloudflare headers, demo page)
```

## Frontend

```bash
npm install
npm run dev            # standalone page; /embed.html and /roster.html show the web components on a fake host page
npm test               # vitest
npm run build:embed    # dist-embed/artist-epk.js for the CDN
```

`VITE_API_URL` (in `.env.local`) points at the backend; leave it unset to use built-in sample data.

## GoDaddy (HTML section → Custom code)

One artist's press kit:

```html
<style>body{margin:0}</style>
<artist-epk artist-id="ariovistus"></artist-epk>
<script type="module" src="https://agency-epk.<your-subdomain>.workers.dev/artist-epk.js"></script>
```

Mosaic of every artist with a published press kit (main agency page). The same script registers
both components. `href-template` is optional: each tile links there, with `{id}` replaced by the
artist id; without it, tiles don't link anywhere.

```html
<style>body{margin:0}</style>
<artist-roster href-template="https://berlinrecords.info/epk?artist={id}"></artist-roster>
<script type="module" src="https://agency-epk.<your-subdomain>.workers.dev/artist-epk.js"></script>
```

## Deploys

**Embed → Cloudflare Workers** (static assets, Cloudflare's GitHub integration: every push to
`main` deploys; other branches get preview URLs). Worker → Settings → Build:

| Setting | Value |
|---|---|
| Build command | `npm run build:embed` |
| Deploy command | `npx wrangler deploy` |
| Root directory | *(empty)* |
| Build variable `VITE_API_URL` | Public URL of the backend (optional; unset = sample data) |

`wrangler.jsonc` tells `wrangler deploy` to upload `dist-embed/`; its `name` must match the Worker's
name in the dashboard. `embed-public/_headers` sets CORS and caching. Manual deploy:
`npm run deploy:embed` (after `npx wrangler login`).

Node version comes from `.nvmrc`.

**Backend image → ghcr.io/<owner>/<repo>-api** via GitHub Actions (`.github/workflows/pipeline.yml`),
which also runs typecheck, tests, both frontend builds and the backend tests on every PR and push.
Pushes to `main` publish `latest` and short-SHA tags; PRs only build.

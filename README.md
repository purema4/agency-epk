# Artist EPK

Electronic press kit for Berlin Records artists: a React + TypeScript page, shipped as the
`<artist-epk>` web component for GoDaddy, with a FastAPI backend that reads the CRM.

```
src/            React app + <artist-epk> web component (src/embed)
backend/        FastAPI API that queries the CRM (see backend/README.md)
embed-public/   Files deployed next to the embed script (Cloudflare headers, demo page)
```

## Frontend

```bash
npm install
npm run dev            # standalone page; /embed.html shows the web component on a fake host page
npm test               # vitest
npm run build:embed    # dist-embed/artist-epk.js for the CDN
```

`VITE_API_URL` (in `.env.local`) points at the backend; leave it unset to use built-in sample data.

## GoDaddy (HTML section → Custom code)

```html
<style>body{margin:0}</style>
<artist-epk artist-id="ariovistus"></artist-epk>
<script type="module" src="https://artist-epk.pages.dev/artist-epk.js"></script>
```

## Deploys

**Embed → Cloudflare Pages** (GitHub integration, deploys every push; other branches get preview URLs).
Pages project → Settings → Builds & deployments:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build:embed` |
| Build output directory | `dist-embed` |
| Root directory | *(empty)* |
| Env var `VITE_API_URL` | Public URL of the backend (optional; unset = sample data) |

Node version comes from `.nvmrc`.

**Backend image → ghcr.io/<owner>/<repo>-api** via GitHub Actions (`.github/workflows/pipeline.yml`),
which also runs typecheck, tests, both frontend builds and the backend tests on every PR and push.
Pushes to `main` publish `latest` and short-SHA tags; PRs only build.

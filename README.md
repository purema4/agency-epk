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

## CI/CD (.github/workflows/pipeline.yml)

Every PR and push: typecheck, tests, both frontend builds, backend tests, Docker build.
On `main` it also deploys `dist-embed/` to **Cloudflare Pages** and pushes the backend image to
**ghcr.io/<owner>/<repo>-api** (`latest` + short SHA tags).

Repository settings needed (Settings → Secrets and variables → Actions):

| Kind | Name | Value |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API token with *Cloudflare Pages: Edit* |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| Variable | `EMBED_API_URL` | Public URL of the backend (optional; empty = sample data) |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | Pages project name (optional; default `artist-epk`) |

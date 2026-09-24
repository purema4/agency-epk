# Artist EPK API

FastAPI service between the frontend and the Twenty CRM. It queries Twenty's GraphQL API with an API
key (kept server-side), maps the record to the press kit shape, caches it briefly, and serves it with CORS for
`localhost` (any port) and `https://berlinrecords.info` (plus subdomains).

```
GET /artists/{artist_id}/epk   -> press kit JSON (same shape as src/types.ts)
GET /health
```

## Run locally

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env                                   # then set CRM_BASE_URL / CRM_API_TOKEN

.venv/bin/uvicorn mock_crm:app --port 8001             # stand-in Twenty (skip when using the real one)
.venv/bin/uvicorn app.main:create_app --factory --port 8000 --reload
```

Frontend: `VITE_API_URL=http://localhost:8000` in `../.env.local`, then `npm run dev`.

## Docker

```bash
# Whole local stack (API + stand-in CRM): http://localhost:8000
docker compose up --build

# API only, against the real CRM (settings from your .env; nothing secret is baked into the image)
docker build -t artist-epk-api .
docker run --rm -p 8000:8000 --env-file .env artist-epk-api
```

The container listens on `$PORT` (default 8000), runs as a non-root user, and has a health
check on `/health`.

## Test

```bash
.venv/bin/python -m pytest
```

## Hooking up Twenty

Set `CRM_BASE_URL` (the Twenty server URL, e.g. `https://crm.example.com`) and `CRM_API_TOKEN` (an
API key from Twenty → Settings → APIs & Webhooks) in `.env`.

One GraphQL request per artist (`PRESS_KIT_QUERY` in `app/crm.py`) fetches the **Press Kit** whose
`slug` equals the artist id and whose **Published** box is ticked, with its artist, stats and charts.
`map_crm_record()` turns it into the frontend JSON:

| EPK JSON | Twenty (Press Kit) |
|---|---|
| `name` | Display Name, else the artist's Stage Name / Name |
| `label`, `kicker`, `lede` | Label, Kicker, Lede |
| `photo.src` / `photo.alt` | Hero Photo (a public URL) / Hero Photo Alt Text, else the name |
| `tags` | Tags |
| `platforms` | Platforms links (link label = platform name, guessed from the URL when empty), else the artist's Social & Website Links |
| `stats` | Stats records: Value + Label, in the order you arrange them |
| `bio.short` / `bio.extra` | Bio (Short) / Bio (Extra) |
| `charts` | Charts records: Track Title, Record Label, Chart Position |
| `booking` | Booking Contact, Booking Email (primary), Agency Link (URL + label; label defaults to the bare URL) |

Slugs are matched exactly, so keep them lowercase (the API lowercases the requested id). An
unpublished or missing kit is a 404; a published kit missing Hero Photo, Bio (Short), Booking Email
or Agency Link answers 502 and logs which fields to fill in.

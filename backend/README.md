# Artist EPK API

FastAPI service between the frontend and the CRM. It calls the CRM with a bearer token (kept
server-side), validates the answer, caches it briefly, and serves it with CORS for
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

.venv/bin/uvicorn mock_crm:app --port 8001             # stand-in CRM (skip when using the real one)
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

## Hooking up the real CRM

Set `CRM_BASE_URL`, `CRM_API_TOKEN` and, if needed, `CRM_ARTIST_PATH` in `.env`. If the CRM's
JSON isn't already in the press-kit shape, translate it in `map_crm_record()` in `app/crm.py`.

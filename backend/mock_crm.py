"""Stand-in CRM for local development: requires the bearer token, serves mock_data/*.json.

    CRM_API_TOKEN=dev-token uvicorn mock_crm:app --port 8001
"""

import json
import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.staticfiles import StaticFiles

DATA = Path(__file__).parent / "mock_data"
TOKEN = os.environ.get("CRM_API_TOKEN", "dev-token")

app = FastAPI(title="Mock CRM")
app.mount("/static", StaticFiles(directory=DATA), name="static")


@app.get("/artists/{artist_id}/epk")
def artist_epk(artist_id: str, authorization: str = Header(default="")) -> dict:
    if authorization != f"Bearer {TOKEN}":
        raise HTTPException(401, "Invalid or missing bearer token")
    file = DATA / f"{artist_id}.json"
    if not artist_id.replace("-", "").replace("_", "").isalnum() or not file.is_file():
        raise HTTPException(404, "Artist not found")
    return json.loads(file.read_text())

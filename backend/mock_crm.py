"""Stand-in Twenty CRM for local development: requires the bearer token and answers the press kit
and roster GraphQL queries from mock_data/<slug>.crm.json (the record shape Twenty returns).

    CRM_API_TOKEN=dev-token uvicorn mock_crm:app --port 8001
"""

import json
import os
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, Header
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

DATA = Path(__file__).parent / "mock_data"
TOKEN = os.environ.get("CRM_API_TOKEN", "dev-token")

app = FastAPI(title="Mock CRM")
app.mount("/static", StaticFiles(directory=DATA), name="static")


@app.post("/graphql")
def graphql(body: dict[str, Any] = Body(...), authorization: str = Header(default="")) -> JSONResponse:
    if authorization != f"Bearer {TOKEN}":
        # Twenty answers auth failures as GraphQL errors, not HTTP 401.
        return JSONResponse({"errors": [{"message": "Unauthenticated", "extensions": {"code": "UNAUTHENTICATED"}}]})
    variables = body.get("variables") or {}
    if "slug" in variables:  # one press kit
        slug = str(variables["slug"])
        file = DATA / f"{slug}.crm.json"
        found = slug.replace("-", "").replace("_", "").isalnum() and file.is_file()
        nodes = [json.loads(file.read_text())] if found else []
    else:  # the roster: every kit
        nodes = [{**json.loads(f.read_text()), "slug": f.name.removesuffix(".crm.json")} for f in sorted(DATA.glob("*.crm.json"))]
    return JSONResponse({"data": {"pressKits": {"edges": [{"node": n} for n in nodes]}}})

from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import FastAPI, HTTPException, Path, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .cache import TtlCache
from .config import Settings, get_settings
from .crm import ArtistNotFound, CrmClient, CrmError
from .models import Epk

# Any localhost port (http or https), and berlinrecords.info plus its subdomains over https.
ALLOWED_ORIGINS = r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://([a-z0-9-]+\.)*berlinrecords\.info"

ArtistId = Annotated[str, Path(pattern=r"^[A-Za-z0-9_-]{1,64}$", description="Artist id in the CRM")]


# Run with: uvicorn app.main:create_app --factory
def create_app(settings: Settings | None = None, crm_transport: httpx.AsyncBaseTransport | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.crm = CrmClient(settings, transport=crm_transport)
        app.state.cache = TtlCache[Epk](settings.cache_ttl_seconds)
        yield
        await app.state.crm.aclose()

    app = FastAPI(title="Artist EPK API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=ALLOWED_ORIGINS,
        allow_methods=["GET"],
        allow_headers=["Accept"],
        max_age=86400,
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # exclude_none: optional fields are omitted, never null (the frontend expects string or absent).
    @app.get("/artists/{artist_id}/epk", response_model=Epk, response_model_by_alias=True, response_model_exclude_none=True)
    async def get_epk(artist_id: ArtistId, request: Request, response: Response) -> Epk:
        key = artist_id.lower()
        crm: CrmClient = request.app.state.crm
        try:
            epk = await request.app.state.cache.get_or_load(key, lambda: crm.get_epk(key))
        except ArtistNotFound:
            raise HTTPException(404, "Artist not found")
        except CrmError as exc:
            raise HTTPException(exc.status, exc.message)
        response.headers["Cache-Control"] = f"public, max-age={int(settings.cache_ttl_seconds)}"
        return epk

    return app


from contextlib import asynccontextmanager
from typing import Annotated

import httpx
from fastapi import FastAPI, HTTPException, Path, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .cache import TtlCache
from .config import Settings, get_settings
from .crm import ArtistNotFound, CrmClient, CrmError
from .models import Epk, Roster

# Any localhost port (http or https), berlinrecords.info plus its subdomains over https, and the
# embed's Cloudflare Worker (its demo page calls the API).
ALLOWED_ORIGINS = (
    r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    r"|https://([a-z0-9-]+\.)*berlinrecords\.info"
    r"|https://agency-epk\.purema4\.workers\.dev"
)

# A JSON API: nothing here should render as a page, be framed, run script or leak a referrer.
SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}

ArtistId = Annotated[str, Path(pattern=r"^[A-Za-z0-9_-]{1,64}$", description="Artist id in the CRM")]


# Run with: uvicorn app.main:create_app --factory
def create_app(settings: Settings | None = None, crm_transport: httpx.AsyncBaseTransport | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.crm = CrmClient(settings, transport=crm_transport)
        app.state.cache = TtlCache[Epk](settings.cache_ttl_seconds)
        app.state.roster_cache = TtlCache[Roster](settings.cache_ttl_seconds)
        yield
        await app.state.crm.aclose()

    # No /docs, /redoc or /openapi.json: the API is public, its schema doesn't need to be.
    app = FastAPI(title="Artist EPK API", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.update(SECURITY_HEADERS)
        return response

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

    async def load_roster(request: Request) -> Roster:
        crm: CrmClient = request.app.state.crm
        try:
            return await request.app.state.roster_cache.get_or_load("all", crm.get_roster)
        except CrmError as exc:
            raise HTTPException(exc.status, exc.message)

    # Every published press kit as {id, name, photo}, for the <artist-roster> mosaic.
    @app.get("/artists", response_model=Roster, response_model_by_alias=True)
    async def get_roster(request: Request, response: Response) -> Roster:
        roster = await load_roster(request)
        response.headers["Cache-Control"] = f"public, max-age={int(settings.cache_ttl_seconds)}"
        return roster

    # exclude_none: optional fields are omitted, never null (the frontend expects string or absent).
    @app.get("/artists/{artist_id}/epk", response_model=Epk, response_model_by_alias=True, response_model_exclude_none=True)
    async def get_epk(artist_id: ArtistId, request: Request, response: Response) -> Epk:
        key = artist_id.lower()
        # Only ids on the (cached) roster reach the CRM, so a flood of made-up ids costs nothing
        # upstream. The roster lists the same published kits, minus ones with no photo, which
        # couldn't render anyway.
        if key not in {a.id for a in (await load_roster(request)).artists}:
            raise HTTPException(404, "Artist not found")
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


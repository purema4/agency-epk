import json
from collections.abc import Callable, Iterator
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

TOKEN = "test-token"
ARIOVISTUS = json.loads((Path(__file__).parents[1] / "mock_data" / "ariovistus.json").read_text())


class FakeCrm:
    """Stands in for the CRM over httpx.MockTransport; records every request it receives."""

    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.handler: Callable[[httpx.Request], httpx.Response] = self.default

    def default(self, request: httpx.Request) -> httpx.Response:
        if request.headers.get("authorization") != f"Bearer {TOKEN}":
            return httpx.Response(401)
        if request.url.path == "/v1/artists/ariovistus/epk":
            return httpx.Response(200, json=ARIOVISTUS)
        return httpx.Response(404, json={"error": "not found"})

    def transport(self) -> httpx.MockTransport:
        def handle(request: httpx.Request) -> httpx.Response:
            self.requests.append(request)
            return self.handler(request)

        return httpx.MockTransport(handle)


@pytest.fixture
def crm() -> FakeCrm:
    return FakeCrm()


@pytest.fixture
def settings() -> Settings:
    return Settings(
        crm_base_url="https://crm.test/v1",
        crm_api_token=TOKEN,
        crm_artist_path="/artists/{artist_id}/epk",  # appended to the base URL, keeping its /v1
        cache_ttl_seconds=60,
        _env_file=None,  # type: ignore[call-arg]
    )


@pytest.fixture
def client(settings: Settings, crm: FakeCrm) -> Iterator[TestClient]:
    with TestClient(create_app(settings, crm_transport=crm.transport())) as c:
        yield c

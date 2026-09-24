import logging
from typing import Any
from urllib.parse import quote

import httpx
from pydantic import ValidationError

from .config import Settings
from .models import Epk

log = logging.getLogger(__name__)


class ArtistNotFound(Exception):
    pass


class CrmError(Exception):
    """The CRM failed; `status` is what we answer the frontend with (502/504)."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def map_crm_record(data: Any) -> Epk:
    """Turn the CRM's artist record into the frontend's press kit.

    The CRM is assumed to return the press kit shape directly. If yours uses its own
    field names, translate them here; nothing else needs to change."""
    return Epk.model_validate(data)


class CrmClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._path = settings.crm_artist_path
        # One pooled client for the app's lifetime: keeps connections (and TLS) to the CRM warm.
        self._http = httpx.AsyncClient(
            base_url=settings.crm_base_url,
            headers={
                "Authorization": f"Bearer {settings.crm_api_token.get_secret_value()}",
                "Accept": "application/json",
            },
            timeout=settings.crm_timeout_seconds,
            transport=transport,
        )

    async def get_epk(self, artist_id: str) -> Epk:
        path = self._path.format(artist_id=quote(artist_id, safe=""))
        try:
            res = await self._http.get(path)
        except httpx.TimeoutException:
            log.warning("CRM timed out for %s", artist_id)
            raise CrmError(504, "The CRM took too long to answer")
        except httpx.HTTPError as exc:
            log.warning("CRM unreachable: %s", exc)
            raise CrmError(502, "Could not reach the CRM")

        if res.status_code == 404:
            raise ArtistNotFound(artist_id)
        if res.status_code in (401, 403):
            log.error("CRM rejected the API token (HTTP %s)", res.status_code)
            raise CrmError(502, "The CRM rejected our credentials")
        if res.is_error:
            log.warning("CRM error %s for %s", res.status_code, artist_id)
            raise CrmError(502, f"The CRM returned an error ({res.status_code})")

        try:
            return map_crm_record(res.json())
        except (ValueError, ValidationError) as exc:
            log.error("Unexpected CRM payload for %s: %s", artist_id, exc)
            raise CrmError(502, "The CRM returned data in an unexpected format")

    async def aclose(self) -> None:
        await self._http.aclose()

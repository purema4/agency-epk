import logging
from typing import Any
from urllib.parse import urlparse

import httpx
from pydantic import ValidationError

from .config import Settings
from .models import Epk

log = logging.getLogger(__name__)

# One round trip: the published press kit for a slug, its artist, stats and chart entries.
# Twenty caps nested collections at 60 records, far more than an EPK shows.
PRESS_KIT_QUERY = """
query PressKit($slug: String!) {
  pressKits(filter: { slug: { eq: $slug }, isPublished: { eq: true } }, first: 1) {
    edges {
      node {
        name
        label
        kicker
        photo { primaryLinkUrl }
        photoAlt
        tags
        platforms { primaryLinkUrl primaryLinkLabel secondaryLinks }
        lede
        bioShort
        bioExtra
        bookingContact
        bookingEmail { primaryEmail }
        agencyLink { primaryLinkUrl primaryLinkLabel }
        artist { name stageName socialLinks { primaryLinkUrl primaryLinkLabel secondaryLinks } }
        stats { edges { node { name value position } } }
        charts { edges { node { name recordLabel chartPosition spotifyLink { primaryLinkUrl } position } } }
      }
    }
  }
}
"""

# Link labels for platforms whose label was left empty in the CRM, keyed by domain.
PLATFORM_NAMES = {
    "spotify": "Spotify",
    "beatport": "Beatport",
    "soundcloud": "SoundCloud",
    "youtube": "YouTube",
    "youtu": "YouTube",
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "facebook": "Facebook",
    "bandcamp": "Bandcamp",
    "music.apple": "Apple Music",
    "mixcloud": "Mixcloud",
    "residentadvisor": "Resident Advisor",
    "ra": "Resident Advisor",
}


class ArtistNotFound(Exception):
    pass


class CrmError(Exception):
    """The CRM failed; `status` is what we answer the frontend with (502/504)."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _text(value: Any) -> str | None:
    """Twenty stores empty text as "" — treat that like a missing value."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _nodes(connection: Any) -> list[dict]:
    """Records of a one-to-many relation, in the order they're arranged in the CRM."""
    nodes = [edge["node"] for edge in (connection or {}).get("edges", [])]
    return sorted(nodes, key=lambda n: n.get("position") if n.get("position") is not None else float("inf"))


def _platform_name(url: str) -> str:
    host = (urlparse(url).hostname or "").removeprefix("www.").removeprefix("open.").removeprefix("m.")
    for domain, name in PLATFORM_NAMES.items():
        if host == domain or host.startswith(domain + "."):
            return name
    return host.split(".")[0].capitalize() or url


def _links(field: Any) -> list[dict[str, str]]:
    """A Twenty LINKS field (primary + secondary links) as [{name, url}]."""
    if not field:
        return []
    links = [{"url": field.get("primaryLinkUrl"), "label": field.get("primaryLinkLabel")}]
    links += field.get("secondaryLinks") or []
    return [
        {"name": _text(link.get("label")) or _platform_name(url), "url": url}
        for link in links
        if (url := _text(link.get("url")))
    ]


def _display_url(url: str | None) -> str | None:
    """https://berlinrecords.info/agency -> BERLINRECORDS.INFO/AGENCY"""
    if not url:
        return None
    parsed = urlparse(url)
    return (parsed.netloc.removeprefix("www.") + parsed.path.rstrip("/")).upper() or None


def map_crm_record(kit: dict[str, Any]) -> Epk:
    """Turn a Twenty press kit record (with its artist, stats and charts) into the frontend's
    press kit. Raises ValidationError when a required field is empty in the CRM."""
    artist = kit.get("artist") or {}
    name = _text(kit.get("name")) or _text(artist.get("stageName")) or _text(artist.get("name"))
    agency = kit.get("agencyLink") or {}
    agency_url = _text(agency.get("primaryLinkUrl"))

    return Epk.model_validate(
        {
            "name": name,
            "label": _text(kit.get("label")) or "",
            "kicker": _text(kit.get("kicker")) or "",
            "photo": {
                "src": _text((kit.get("photo") or {}).get("primaryLinkUrl")),
                "alt": _text(kit.get("photoAlt")) or name,
            },
            "tags": [t for tag in kit.get("tags") or [] if (t := _text(tag))],
            # The kit's own list wins; otherwise fall back to the artist's social links.
            "platforms": _links(kit.get("platforms")) or _links(artist.get("socialLinks")),
            "lede": _text(kit.get("lede")) or "",
            "stats": [
                {"value": value, "label": label}
                for s in _nodes(kit.get("stats"))
                if (value := _text(s.get("value"))) and (label := _text(s.get("name")))
            ],
            "bio": {"short": _text(kit.get("bioShort")), "extra": _text(kit.get("bioExtra"))},
            "charts": [
                {
                    "title": title,
                    "label": _text(c.get("recordLabel")) or "",
                    "position": _text(c.get("chartPosition")) or "",
                    "url": _text((c.get("spotifyLink") or {}).get("primaryLinkUrl")),
                }
                for c in _nodes(kit.get("charts"))
                if (title := _text(c.get("name")))
            ],
            "booking": {
                "contact": _text(kit.get("bookingContact")),
                "email": _text((kit.get("bookingEmail") or {}).get("primaryEmail")),
                "agencyUrl": agency_url,
                "agencyLabel": _text(agency.get("primaryLinkLabel")) or _display_url(agency_url),
            },
        }
    )


class CrmClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._path = settings.crm_graphql_path
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
        try:
            res = await self._http.post(self._path, json={"query": PRESS_KIT_QUERY, "variables": {"slug": artist_id}})
        except httpx.TimeoutException:
            log.warning("CRM timed out for %s", artist_id)
            raise CrmError(504, "The CRM took too long to answer")
        except httpx.HTTPError as exc:
            log.warning("CRM unreachable: %s", exc)
            raise CrmError(502, "Could not reach the CRM")

        if res.status_code in (401, 403):
            log.error("CRM rejected the API token (HTTP %s)", res.status_code)
            raise CrmError(502, "The CRM rejected our credentials")
        if res.is_error:
            log.warning("CRM error %s for %s", res.status_code, artist_id)
            raise CrmError(502, f"The CRM returned an error ({res.status_code})")

        try:
            body = res.json()
        except ValueError:
            log.error("CRM answered %s with non-JSON", artist_id)
            raise CrmError(502, "The CRM returned data in an unexpected format")

        # GraphQL reports failures (bad token, unknown field) in `errors`, often with HTTP 200.
        if errors := body.get("errors"):
            codes = {(e.get("extensions") or {}).get("code") for e in errors}
            log.error("CRM GraphQL errors for %s: %s", artist_id, [e.get("message") for e in errors])
            if codes & {"UNAUTHENTICATED", "FORBIDDEN"}:
                raise CrmError(502, "The CRM rejected our credentials")
            raise CrmError(502, "The CRM rejected the press kit query")

        try:
            edges = body["data"]["pressKits"]["edges"]
        except (KeyError, TypeError):
            log.error("Unexpected CRM payload for %s: %.200s", artist_id, body)
            raise CrmError(502, "The CRM returned data in an unexpected format")
        if not edges:
            raise ArtistNotFound(artist_id)

        try:
            return map_crm_record(edges[0]["node"])
        except ValidationError as exc:
            missing = ", ".join(".".join(map(str, e["loc"])) for e in exc.errors())
            log.error("Press kit %s is incomplete in the CRM: %s", artist_id, missing)
            raise CrmError(502, f"The press kit is missing required fields: {missing}")

    async def aclose(self) -> None:
        await self._http.aclose()

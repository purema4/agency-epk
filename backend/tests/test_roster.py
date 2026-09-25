import json

import httpx

from app.crm import map_roster

from .conftest import ARIOVISTUS, ARIOVISTUS_CRM, graphql_answer


def kit(slug: str, position: float | None, **changes) -> dict:
    return {**ARIOVISTUS_CRM, "slug": slug, "name": slug.upper(), "position": position, **changes}


def test_lists_published_press_kits_as_cards(client, crm):
    res = client.get("/artists")
    assert res.status_code == 200
    assert res.json() == {"artists": [{"id": "ariovistus", "name": "ARIOVISTUS", "photo": ARIOVISTUS["photo"]}]}
    assert res.headers["cache-control"] == "public, max-age=60"

    [req] = crm.requests
    body = json.loads(req.content)
    assert body["variables"] == {}
    assert "isPublished: { eq: true }" in body["query"]


def test_roster_is_cached(client, crm):
    client.get("/artists")
    client.get("/artists")
    assert len(crm.requests) == 1


def test_roster_follows_the_crm_order():
    roster = map_roster([kit("c", None), kit("b", 2), kit("a", 1)])
    assert [a.id for a in roster.artists] == ["a", "b", "c"]


def test_kits_that_cannot_make_a_tile_are_left_out():
    roster = map_roster(
        [
            kit("ok", 0),
            kit("no-photo", 1, photo={"primaryLinkUrl": ""}),
            kit("", 2),  # no slug: nothing to link to
            kit("no-name", 3, name="", artist=None),
        ]
    )
    assert [a.id for a in roster.artists] == ["ok"]


def test_name_and_alt_fall_back_to_the_artist():
    [card] = map_roster([kit("x", 0, name="", photoAlt="", artist={"stageName": "STAGE", "name": "Legal"})]).artists
    assert card.name == "STAGE"
    assert card.photo.alt == "STAGE"


def test_slugs_are_lowercased_like_artist_ids():
    [card] = map_roster([kit("Ario", 0)]).artists
    assert card.id == "ario"


def test_empty_roster(client, crm):
    crm.handler = lambda req: graphql_answer()
    assert client.get("/artists").json() == {"artists": []}


def test_crm_failures_become_gateway_errors(client, crm):
    crm.handler = lambda req: httpx.Response(500)
    res = client.get("/artists")
    assert res.status_code == 502
    assert res.json()["detail"] == "The CRM returned an error (500)"

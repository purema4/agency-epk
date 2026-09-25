import json

import httpx
import pytest

from .conftest import ARIOVISTUS, ARIOVISTUS_CRM, TOKEN, graphql_answer, kit_handler

URL = "/artists/ariovistus/epk"


def test_returns_the_press_kit_from_the_crm(client, crm):
    res = client.get(URL)
    assert res.status_code == 200
    assert res.json() == ARIOVISTUS  # same camelCase shape the frontend expects
    assert res.headers["cache-control"] == "public, max-age=60"


def test_queries_twenty_graphql_with_the_bearer_token(client, crm):
    client.get(URL)
    roster, kit = crm.requests  # the id is checked against the roster first
    for req in (roster, kit):
        assert req.headers["authorization"] == f"Bearer {TOKEN}"
        assert req.method == "POST"
        assert req.url == "https://crm.test/v1/graphql"
    body = json.loads(kit.content)
    assert body["variables"] == {"slug": "ariovistus"}
    assert "isPublished: { eq: true }" in body["query"]  # drafts are never served


def test_never_exposes_the_token(client):
    res = client.get(URL)
    assert TOKEN not in res.text
    assert all(TOKEN not in v for v in res.headers.values())


def test_caches_crm_answers(client, crm):
    assert client.get(URL).status_code == 200
    assert client.get("/artists/ARIOVISTUS/epk").status_code == 200  # ids are case-insensitive
    assert len(crm.requests) == 2  # one roster + one press kit


def test_unknown_artist_is_404(client):
    res = client.get("/artists/nobody/epk")
    assert res.status_code == 404
    assert res.json() == {"detail": "Artist not found"}


def test_errors_are_not_cached(client, crm):
    crm.handler = lambda req: httpx.Response(503)
    assert client.get(URL).status_code == 502
    crm.handler = crm.default
    assert client.get(URL).status_code == 200


@pytest.mark.parametrize(
    ("crm_answer", "status", "detail"),
    [
        (lambda req: httpx.Response(401), 502, "The CRM rejected our credentials"),
        (lambda req: httpx.Response(500), 502, "The CRM returned an error (500)"),
        (lambda req: httpx.Response(200, json={"data": None}), 502, "unexpected format"),
        (lambda req: httpx.Response(200, text="<html>not json</html>"), 502, "unexpected format"),
        (
            lambda req: httpx.Response(200, json={"errors": [{"message": "no", "extensions": {"code": "UNAUTHENTICATED"}}]}),
            502,
            "The CRM rejected our credentials",
        ),
        (
            lambda req: httpx.Response(200, json={"errors": [{"message": "Cannot query field \"slug\""}]}),
            502,
            "The CRM rejected the press kit query",
        ),
        (kit_handler({**ARIOVISTUS_CRM, "bioShort": ""}), 502, "The press kit is incomplete in the CRM"),
    ],
)
def test_crm_failures_become_gateway_errors(client, crm, crm_answer, status, detail):
    crm.handler = crm_answer
    res = client.get(URL)
    assert res.status_code == status
    assert detail in res.json()["detail"]


def test_crm_timeout_is_504(client, crm):
    def slow(req):
        raise httpx.ReadTimeout("slow", request=req)

    crm.handler = slow
    assert client.get(URL).status_code == 504


def test_crm_down_is_502(client, crm):
    def down(req):
        raise httpx.ConnectError("refused", request=req)

    crm.handler = down
    res = client.get(URL)
    assert res.status_code == 502
    assert res.json()["detail"] == "Could not reach the CRM"


@pytest.mark.parametrize("bad_id", ["a" * 65, "a.b", "a%2Fb", "%2E%2E"])
def test_rejects_odd_artist_ids_without_calling_the_crm(client, crm, bad_id):
    assert client.get(f"/artists/{bad_id}/epk").status_code in (404, 422)
    assert crm.requests == []


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


@pytest.mark.parametrize(
    "origin",
    [
        "http://localhost:5173",
        "http://localhost",
        "https://localhost:4173",
        "http://127.0.0.1:8080",
        "https://berlinrecords.info",
        "https://www.berlinrecords.info",
        "https://agency-epk.purema4.workers.dev",
    ],
)
def test_cors_allows_localhost_and_berlinrecords(client, origin):
    res = client.get(URL, headers={"Origin": origin})
    assert res.headers["access-control-allow-origin"] == origin

    pre = client.options(URL, headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
    assert pre.status_code == 200
    assert pre.headers["access-control-allow-origin"] == origin


@pytest.mark.parametrize(
    "origin",
    [
        "https://evil.com",
        "https://berlinrecords.info.evil.com",
        "https://notberlinrecords.info",
        "http://berlinrecords.info",  # plain http is not allowed for the live site
        "http://localhost.evil.com",
        "null",
        "http://agency-epk.purema4.workers.dev",
        "https://evil-agency-epk.purema4.workers.dev",
        "https://agency-epk.purema4.workers.dev.evil.com",
    ],
)
def test_cors_blocks_other_origins(client, origin):
    res = client.get(URL, headers={"Origin": origin})
    assert "access-control-allow-origin" not in res.headers


def test_cors_only_allows_get(client):
    pre = client.options(
        URL, headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "DELETE"}
    )
    assert pre.status_code == 400


def test_omits_empty_optional_fields_instead_of_sending_null(client, crm):
    record = {**ARIOVISTUS_CRM, "bioExtra": "", "bookingContact": None}  # Twenty stores empty text as ""
    crm.handler = kit_handler(record)
    body = client.get(URL).json()
    assert "extra" not in body["bio"]
    assert "contact" not in body["booking"]


def test_unknown_ids_never_reach_the_crm_beyond_the_cached_roster(client, crm):
    for i in range(20):
        assert client.get(f"/artists/made-up-{i}/epk").status_code == 404
    [roster] = crm.requests  # one roster lookup, no press kit queries
    assert "slug" not in json.loads(roster.content)["variables"]


def test_press_kit_details_do_not_leak_in_errors(client, crm):
    crm.handler = kit_handler({**ARIOVISTUS_CRM, "bioShort": ""})
    assert "bio" not in client.get(URL).json()["detail"].lower()


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_api_docs_are_not_public(client, path):
    assert client.get(path).status_code == 404


@pytest.mark.parametrize("path", ["/health", URL, "/artists", "/artists/nobody/epk"])
def test_security_headers_on_every_response(client, path):
    res = client.get(path)
    assert res.headers["content-security-policy"] == "default-src 'none'; frame-ancestors 'none'"
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["referrer-policy"] == "no-referrer"

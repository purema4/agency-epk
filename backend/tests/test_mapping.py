import pytest
from pydantic import ValidationError

from app.crm import map_crm_record

from .conftest import ARIOVISTUS, ARIOVISTUS_CRM


def epk(**changes) -> dict:
    return map_crm_record({**ARIOVISTUS_CRM, **changes}).model_dump(by_alias=True, exclude_none=True)


def test_sample_record_maps_to_the_sample_press_kit():
    assert epk() == ARIOVISTUS


def test_stats_and_charts_follow_their_crm_order_not_creation_order():
    stats = [
        {"name": "Second", "value": "2", "position": 2},
        {"name": "First", "value": "1", "position": 1},
        {"name": "Unplaced", "value": "?", "position": None},
    ]
    charts = [{"name": "B", "recordLabel": "L", "chartPosition": "2ND", "position": 5}, {"name": "A", "position": 0}]
    body = epk(stats={"edges": [{"node": n} for n in stats]}, charts={"edges": [{"node": n} for n in charts]})
    assert [s["label"] for s in body["stats"]] == ["First", "Second", "Unplaced"]
    assert body["charts"] == [
        {"title": "A", "label": "", "position": ""},
        {"title": "B", "label": "L", "position": "2ND"},
    ]


def test_charts_carry_their_spotify_link_when_set():
    charts = [
        {"name": "A", "spotifyLink": {"primaryLinkUrl": "https://open.spotify.com/track/1"}, "position": 0},
        {"name": "B", "spotifyLink": {"primaryLinkUrl": ""}, "position": 1},
        {"name": "C", "spotifyLink": None, "position": 2},
    ]
    body = epk(charts={"edges": [{"node": n} for n in charts]})
    assert body["charts"][0]["url"] == "https://open.spotify.com/track/1"
    assert "url" not in body["charts"][1]
    assert "url" not in body["charts"][2]


def test_half_filled_rows_are_skipped():
    body = epk(
        stats={"edges": [{"node": {"name": "No value", "value": ""}}, {"node": {"name": "", "value": "5"}}]},
        charts={"edges": [{"node": {"name": " ", "recordLabel": "X"}}]},
        tags=["TECHNO", "", "  "],
    )
    assert body["stats"] == []
    assert body["charts"] == []
    assert body["tags"] == ["TECHNO"]


def test_platform_names_come_from_the_url_when_the_label_is_empty():
    platforms = {
        "primaryLinkUrl": "https://open.spotify.com/artist/1",
        "primaryLinkLabel": "",
        "secondaryLinks": [
            {"url": "https://www.instagram.com/x", "label": None},
            {"url": "https://ra.co/dj/x", "label": ""},
            {"url": "https://example.org/x", "label": "My site"},
            {"url": "", "label": "Dropped"},
        ],
    }
    assert epk(platforms=platforms)["platforms"] == [
        {"name": "Spotify", "url": "https://open.spotify.com/artist/1"},
        {"name": "Instagram", "url": "https://www.instagram.com/x"},
        {"name": "Resident Advisor", "url": "https://ra.co/dj/x"},
        {"name": "My site", "url": "https://example.org/x"},
    ]


def test_falls_back_to_the_artist_when_the_kit_leaves_things_empty():
    artist = {
        "name": "Ario",
        "stageName": "ARIOVISTUS LIVE",
        "socialLinks": {"primaryLinkUrl": "https://soundcloud.com/x", "primaryLinkLabel": "", "secondaryLinks": None},
    }
    body = epk(name="", photoAlt="", platforms={"primaryLinkUrl": "", "secondaryLinks": []}, artist=artist)
    assert body["name"] == "ARIOVISTUS LIVE"
    assert body["photo"]["alt"] == "ARIOVISTUS LIVE"
    assert body["platforms"] == [{"name": "SoundCloud", "url": "https://soundcloud.com/x"}]


def test_agency_label_defaults_to_the_bare_url():
    body = epk(agencyLink={"primaryLinkUrl": "https://www.berlinrecords.info/agency/", "primaryLinkLabel": ""})
    assert body["booking"]["agencyLabel"] == "BERLINRECORDS.INFO/AGENCY"


@pytest.mark.parametrize("missing", [{"photo": {"primaryLinkUrl": ""}}, {"bookingEmail": None}, {"bioShort": ""}])
def test_required_fields_must_be_filled_in(missing):
    with pytest.raises(ValidationError):
        epk(**missing)


@pytest.mark.parametrize("url", ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "#", "ftp://x.test/a"])
def test_only_web_links_leave_the_api(url):
    links = {"primaryLinkUrl": url, "primaryLinkLabel": "Evil", "secondaryLinks": [{"url": url, "label": "Evil"}]}
    body = epk(
        platforms=links,
        artist={"socialLinks": links},
        agencyLink={"primaryLinkUrl": "https://ok.test", "primaryLinkLabel": "OK"},
        charts={"edges": [{"node": {"name": "T", "spotifyLink": {"primaryLinkUrl": url}}}]},
    )
    assert body["platforms"] == []
    assert "url" not in body["charts"][0]
    with pytest.raises(ValidationError):  # a photo or agency link is required, so a bad one fails the kit
        epk(photo={"primaryLinkUrl": url})
    with pytest.raises(ValidationError):
        epk(agencyLink={"primaryLinkUrl": url})

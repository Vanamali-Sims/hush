"""API tests with ORS mocked out. Data comes from the bundled fixtures, so
these run with no network, no database and no API key — same as the app's
worst-case fallback mode."""

import pytest
from fastapi.testclient import TestClient

from app import db, main, ors

client = TestClient(main.app)

# Two short fake routes between Melbourne Central and Flinders Lane.
FAKE_ROUTES = [
    {
        "via": "Swanston St",
        "duration_s": 900,
        "distance_m": 1200,
        "coordinates": [(144.9628, -37.8100), (144.9655, -37.8167)],
    },
    {
        "via": "Elizabeth St",
        "duration_s": 720,
        "distance_m": 1100,
        "coordinates": [(144.9628, -37.8100), (144.9610, -37.8150), (144.9655, -37.8167)],
    },
]


@pytest.fixture(autouse=True)
def no_db_and_fake_ors(monkeypatch):
    monkeypatch.setattr(db, "fetch_recent_readings", lambda: None)
    monkeypatch.setattr(db, "fetch_sensors", lambda: None)
    monkeypatch.setattr(db, "fetch_refuges", lambda: None)
    monkeypatch.setattr(ors, "get_routes", lambda *a: (list(FAKE_ROUTES), "live"))
    # Force the snapshot tier for readings (no live network in tests).
    monkeypatch.setattr(main.data_source, "fetch_live_feed", lambda: None)


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_status_reports_snapshot_source():
    body = client.get("/api/status").json()
    assert body["data_source"] == "snapshot"
    assert body["sensors_reporting"] > 0


def test_routes_sorted_and_complete():
    body = client.post(
        "/api/routes",
        json={
            "from": {"lat": -37.8100, "lon": 144.9628},
            "to": {"lat": -37.8167, "lon": 144.9655},
        },
    ).json()
    # AC 1.1.3: all routes returned, sorted by soonest arrival.
    assert len(body["routes"]) == 2
    durations = [r["duration_min"] for r in body["routes"]]
    assert durations == sorted(durations)
    first = body["routes"][0]
    for key in (
        "via",
        "geometry",
        "avg_density",
        "worst",
        "segments_total",
        "segments_no_data",
        "matched_sensors",
    ):
        assert key in first
    assert body["data"]["source"] == "snapshot"
    assert body["data"]["age_min"] is not None


def test_routes_rejects_same_point():
    resp = client.post(
        "/api/routes",
        json={
            "from": {"lat": -37.8100, "lon": 144.9628},
            "to": {"lat": -37.8100, "lon": 144.9628},
        },
    )
    assert resp.status_code == 400


def test_route_service_down_gives_plain_language_503(monkeypatch):
    def boom(*a):
        raise ors.RouteServiceError("down")

    monkeypatch.setattr(ors, "get_routes", boom)
    resp = client.post(
        "/api/routes",
        json={
            "from": {"lat": -37.8100, "lon": 144.9628},
            "to": {"lat": -37.8167, "lon": 144.9655},
        },
    )
    assert resp.status_code == 503
    assert "try again" in resp.json()["detail"].lower()


def test_refuges_nearest_first():
    body = client.get(
        "/api/refuges", params={"lat": -37.8098, "lon": 144.9646, "limit": 3}
    ).json()
    assert len(body["refuges"]) == 3
    distances = [r["distance_m"] for r in body["refuges"]]
    assert distances == sorted(distances)


def test_geocode_curated_fallback_without_key():
    body = client.get("/api/geocode", params={"text": "flinders"}).json()
    labels = [r["label"] for r in body["results"]]
    assert any("Flinders" in label for label in labels)

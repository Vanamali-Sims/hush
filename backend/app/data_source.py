"""Pedestrian data access with a three-tier fallback chain.

Readings:  1. Postgres (kept fresh by the GitHub Actions sync job)
           2. Live City of Melbourne feed (fetched directly, cached in memory)
           3. Bundled snapshot fixture committed in backend/data/

Sensors and refuges: Postgres first, bundled fixture otherwise (they change
rarely, so the fixture is always an acceptable answer).

Every response carries `source` and `as_of` so the UI can tell the user
honestly how fresh the data is.
"""

from __future__ import annotations

import json
import logging
import time
import urllib.parse
from datetime import datetime

import httpx

from . import config, db
from .scoring import aggregate_readings

log = logging.getLogger(__name__)

_feed_cache: dict = {"at": 0.0, "rows": None}


def _load_fixture(name: str) -> list[dict]:
    path = config.DATA_DIR / f"{name}.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    return doc["records"]


def _fixture_fetched_at(name: str) -> str | None:
    path = config.DATA_DIR / f"{name}.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    return doc.get("fetched_at")


def fetch_live_feed() -> list[dict] | None:
    """Pull the past-hour feed straight from the CoM portal, with a short cache."""
    now = time.monotonic()
    if _feed_cache["rows"] is not None and now - _feed_cache["at"] < config.FEED_CACHE_TTL_S:
        return _feed_cache["rows"]
    try:
        qs = urllib.parse.urlencode({"where": "sensing_datetime>=now(minutes=-90)"})
        url = (
            f"{config.MELBOURNE_PORTAL}/catalog/datasets/"
            f"{config.PAST_HOUR_DATASET}/exports/json?{qs}"
        )
        resp = httpx.get(url, timeout=30)
        resp.raise_for_status()
        rows = resp.json()
        if rows:
            _feed_cache.update(at=now, rows=rows)
            return rows
    except Exception as exc:  # noqa: BLE001
        log.warning("live feed fetch failed: %s", exc)
    return _feed_cache["rows"]  # possibly stale, possibly None — better than nothing


def get_readings() -> tuple[dict[int, float], datetime | None, str]:
    """Returns (people/min per sensor, as-of timestamp, source label)."""
    rows = db.fetch_recent_readings()
    if rows:
        readings, as_of = aggregate_readings(rows)
        if readings:
            return readings, as_of, "database"

    rows = fetch_live_feed()
    if rows:
        readings, as_of = aggregate_readings(rows)
        if readings:
            return readings, as_of, "live"

    readings, as_of = aggregate_readings(_load_fixture("readings_snapshot"))
    return readings, as_of, "snapshot"


def get_sensors() -> list[dict]:
    return db.fetch_sensors() or _load_fixture("sensor_locations")


def get_refuges() -> list[dict]:
    return db.fetch_refuges() or _load_fixture("refuge_spaces")

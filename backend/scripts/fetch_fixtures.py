"""Download City of Melbourne open datasets into backend/data/ as fixtures.

These fixtures serve two purposes:
1. Fallback data so the app keeps working if the live feed or database is down.
2. Seed data for the sensor_locations and refuge_spaces tables.

Run from repo root:  python backend/scripts/fetch_fixtures.py
Uses only the standard library so it runs before any dependencies are installed.
"""

from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PORTAL = "https://data.melbourne.vic.gov.au/api/explore/v2.1"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

SENSOR_LOCATIONS_DATASET = "pedestrian-counting-system-sensor-locations"
PAST_HOUR_DATASET = "pedestrian-counting-system-past-hour-counts-per-minute"
LANDMARKS_DATASET = (
    "landmarks-and-places-of-interest-including-schools-theatres-health-services-spor"
)

# Landmark sub-themes suitable as low-stimulation refuge spaces.
REFUGE_SUBTHEMES = {
    "Informal Outdoor Facility (Park/Garden/Reserve)": "park",
    "Library": "library",
    "Church": "place of worship",
    "Synagogue": "place of worship",
    "Art Gallery/Museum": "gallery or museum",
}


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "hush-fixture-fetch"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def export_dataset(dataset_id: str, where: str | None = None):
    url = f"{PORTAL}/catalog/datasets/{dataset_id}/exports/json"
    if where:
        url += "?" + urllib.parse.urlencode({"where": where})
    return fetch_json(url)


def save(name: str, records) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out = DATA_DIR / f"{name}.json"
    doc = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
    out.write_text(json.dumps(doc, indent=1), encoding="utf-8")
    print(f"wrote {out} ({len(records)} records)")


def main() -> int:
    failures = 0

    try:
        sensors = export_dataset(SENSOR_LOCATIONS_DATASET)
        save("sensor_locations", sensors)
    except Exception as exc:  # noqa: BLE001
        failures += 1
        print(f"FAILED {SENSOR_LOCATIONS_DATASET}: {exc}", file=sys.stderr)

    try:
        readings = export_dataset(
            PAST_HOUR_DATASET, where="sensing_datetime>=now(minutes=-90)"
        )
        save("readings_snapshot", readings)
    except Exception as exc:  # noqa: BLE001
        failures += 1
        print(f"FAILED {PAST_HOUR_DATASET}: {exc}", file=sys.stderr)

    try:
        landmarks = export_dataset(LANDMARKS_DATASET)
        refuges = []
        for lm in landmarks:
            kind = REFUGE_SUBTHEMES.get(lm.get("sub_theme"))
            coords = lm.get("co_ordinates") or {}
            if kind and coords.get("lat") and coords.get("lon"):
                refuges.append(
                    {
                        "name": lm["feature_name"],
                        "kind": kind,
                        "lat": coords["lat"],
                        "lon": coords["lon"],
                    }
                )
        refuges.sort(key=lambda r: (r["kind"], r["name"]))
        save("refuge_spaces", refuges)
    except Exception as exc:  # noqa: BLE001
        failures += 1
        print(f"FAILED {LANDMARKS_DATASET}: {exc}", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

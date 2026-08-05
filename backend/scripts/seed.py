"""Create the schema and seed sensor_locations + refuge_spaces from fixtures.

Usage:  python backend/scripts/seed.py
Requires DATABASE_URL in the environment or backend/.env.
Safe to re-run: everything is upserted.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config  # noqa: E402

SCHEMA = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")


def load_fixture(name: str) -> list[dict]:
    doc = json.loads((config.DATA_DIR / f"{name}.json").read_text(encoding="utf-8"))
    return doc["records"]


def main() -> int:
    if not config.DATABASE_URL:
        print("DATABASE_URL is not set — nothing to seed.", file=sys.stderr)
        return 1

    sensors = load_fixture("sensor_locations")
    refuges = load_fixture("refuge_spaces")

    with psycopg.connect(config.DATABASE_URL) as conn:
        conn.execute(SCHEMA)

        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO sensor_locations
                    (location_id, sensor_description, sensor_name,
                     latitude, longitude, status, location_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (location_id) DO UPDATE SET
                    sensor_description = EXCLUDED.sensor_description,
                    sensor_name = EXCLUDED.sensor_name,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    status = EXCLUDED.status,
                    location_type = EXCLUDED.location_type
                """,
                [
                    (
                        s["location_id"],
                        s.get("sensor_description"),
                        s.get("sensor_name"),
                        s.get("latitude"),
                        s.get("longitude"),
                        s.get("status"),
                        s.get("location_type"),
                    )
                    for s in sensors
                    if s.get("latitude") is not None
                ],
            )
            cur.executemany(
                """
                INSERT INTO refuge_spaces (name, kind, lat, lon)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (name, kind) DO UPDATE SET
                    lat = EXCLUDED.lat, lon = EXCLUDED.lon
                """,
                [(r["name"], r["kind"], r["lat"], r["lon"]) for r in refuges],
            )

    print(f"seeded {len(sensors)} sensors and {len(refuges)} refuge spaces")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

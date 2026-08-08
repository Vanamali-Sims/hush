"""Create the schema and seed the static reference tables from fixtures:
sensor_locations, refuge_spaces, theme, landmark_category, landmark.

planned_activity is intentionally not seeded by this script yet — schema
only this iteration, per the corrections in Jplan.md; nothing reads it.

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
from fetch_fixtures import REFUGE_SUBTHEMES  # noqa: E402

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
    landmarks = load_fixture("landmarks")

    with psycopg.connect(config.DATABASE_URL) as conn:
        conn.execute(SCHEMA)

        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO sensor_locations
                    (location_id, sensor_description, sensor_name,
                     latitude, longitude, status, location_type,
                     direction_1_label, direction_2_label, installation_date, note)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (location_id) DO UPDATE SET
                    sensor_description = EXCLUDED.sensor_description,
                    sensor_name = EXCLUDED.sensor_name,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    status = EXCLUDED.status,
                    location_type = EXCLUDED.location_type,
                    direction_1_label = EXCLUDED.direction_1_label,
                    direction_2_label = EXCLUDED.direction_2_label,
                    installation_date = EXCLUDED.installation_date,
                    note = EXCLUDED.note
                """,
                [
                    (
                        str(s["location_id"]),
                        s.get("sensor_description"),
                        s.get("sensor_name"),
                        s.get("latitude"),
                        s.get("longitude"),
                        s.get("status"),
                        s.get("location_type"),
                        s.get("direction_1"),
                        s.get("direction_2"),
                        s.get("installation_date") or None,
                        s.get("note"),
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

            # theme -> landmark_category -> landmark. Not wired to any
            # endpoint yet; refuge_spaces above stays the live source for
            # GET /api/refuges. Built alongside it, not instead of it.
            theme_names = sorted({lm["theme"] for lm in landmarks if lm.get("theme")})
            cur.executemany(
                """
                INSERT INTO theme (theme_name) VALUES (%s)
                ON CONFLICT (theme_name) DO NOTHING
                """,
                [(name,) for name in theme_names],
            )
            theme_id_by_name = dict(cur.execute("SELECT theme_name, theme_id FROM theme").fetchall())

            categories = sorted(
                {
                    (lm["sub_theme"], lm["theme"])
                    for lm in landmarks
                    if lm.get("sub_theme") and lm.get("theme")
                }
            )
            cur.executemany(
                """
                INSERT INTO landmark_category (sub_theme, theme_id, is_quiet_space)
                VALUES (%s, %s, %s)
                ON CONFLICT (sub_theme) DO UPDATE SET
                    theme_id = EXCLUDED.theme_id,
                    is_quiet_space = EXCLUDED.is_quiet_space
                """,
                [
                    (sub_theme, theme_id_by_name[theme_name], sub_theme in REFUGE_SUBTHEMES)
                    for sub_theme, theme_name in categories
                ],
            )
            category_id_by_subtheme = dict(
                cur.execute("SELECT sub_theme, category_id FROM landmark_category").fetchall()
            )

            landmark_rows = [
                (
                    lm["feature_name"],
                    category_id_by_subtheme[lm["sub_theme"]],
                    lm["co_ordinates"]["lat"],
                    lm["co_ordinates"]["lon"],
                )
                for lm in landmarks
                if lm.get("sub_theme") and lm.get("co_ordinates")
            ]
            cur.executemany(
                """
                INSERT INTO landmark (feature_name, category_id, latitude, longitude)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (feature_name, category_id) DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude
                """,
                landmark_rows,
            )

    print(
        f"seeded {len(sensors)} sensors, {len(refuges)} refuge spaces, "
        f"{len(theme_names)} themes, {len(categories)} landmark categories, "
        f"{len(landmark_rows)} landmarks"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

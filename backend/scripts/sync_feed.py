"""Sync job: pull the City of Melbourne past-hour pedestrian feed into Postgres.

Run by GitHub Actions on a schedule (see .github/workflows/sync-pedestrian-data.yml)
and safe to run by hand:  python backend/scripts/sync_feed.py

- Upserts the last 90 minutes of per-minute readings.
- Prunes readings older than 24 hours to keep the free-tier database tiny.
- Exits non-zero on failure so the workflow shows red and you notice.
"""

from __future__ import annotations

import sys
import urllib.parse
from pathlib import Path

import httpx
import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config  # noqa: E402

SCHEMA = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")


def fetch_feed() -> list[dict]:
    qs = urllib.parse.urlencode({"where": "sensing_datetime>=now(minutes=-90)"})
    url = (
        f"{config.MELBOURNE_PORTAL}/catalog/datasets/"
        f"{config.PAST_HOUR_DATASET}/exports/json?{qs}"
    )
    resp = httpx.get(url, timeout=60)
    resp.raise_for_status()
    return resp.json()


def main() -> int:
    if not config.DATABASE_URL:
        print("DATABASE_URL is not set.", file=sys.stderr)
        return 1

    rows = fetch_feed()
    if not rows:
        print("feed returned no rows — leaving existing data untouched", file=sys.stderr)
        return 1

    with psycopg.connect(config.DATABASE_URL) as conn:
        conn.execute(SCHEMA)
        with conn.cursor() as cur:
            # total_of_direction is GENERATED ALWAYS AS ... STORED: it must
            # never appear in an insert column list or an ON CONFLICT SET —
            # Postgres rejects any write that references a generated column.
            cur.executemany(
                """
                INSERT INTO pedestrian_minute_count
                    (location_id, sensing_datetime, direction_1_count, direction_2_count)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (location_id, sensing_datetime) DO UPDATE SET
                    direction_1_count = EXCLUDED.direction_1_count,
                    direction_2_count = EXCLUDED.direction_2_count
                """,
                [
                    (
                        str(r["location_id"]),
                        r["sensing_datetime"],
                        r.get("direction_1"),
                        r.get("direction_2"),
                    )
                    for r in rows
                ],
            )
            cur.execute(
                "DELETE FROM pedestrian_minute_count WHERE sensing_datetime < now() - interval '24 hours'"
            )
            pruned = cur.rowcount

    print(f"upserted {len(rows)} readings, pruned {pruned} old rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

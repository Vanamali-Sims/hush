"""Optional Postgres access. If DATABASE_URL is unset or the database is
unreachable, every function returns None and callers fall back to the live
feed or the bundled snapshot. The app must never crash because of the DB."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import psycopg
from psycopg.rows import dict_row

from . import config

log = logging.getLogger(__name__)


def _connect() -> psycopg.Connection | None:
    if not config.DATABASE_URL:
        return None
    try:
        return psycopg.connect(config.DATABASE_URL, row_factory=dict_row, connect_timeout=10)
    except Exception as exc:  # noqa: BLE001
        log.warning("database unavailable: %s", exc)
        return None


def fetch_recent_readings() -> list[dict] | None:
    """Latest readings from sensor_readings, or None if DB is unusable/stale."""
    conn = _connect()
    if conn is None:
        return None
    try:
        with conn:
            cutoff = datetime.now(timezone.utc) - timedelta(
                minutes=config.DB_READINGS_MAX_AGE_MIN
            )
            rows = conn.execute(
                """
                SELECT location_id, sensing_datetime, total_of_directions
                FROM sensor_readings
                WHERE sensing_datetime >= %s
                """,
                (cutoff,),
            ).fetchall()
        return rows or None
    except Exception as exc:  # noqa: BLE001
        log.warning("readings query failed: %s", exc)
        return None
    finally:
        conn.close()


def fetch_sensors() -> list[dict] | None:
    conn = _connect()
    if conn is None:
        return None
    try:
        with conn:
            rows = conn.execute(
                """
                SELECT location_id, sensor_description, sensor_name,
                       latitude, longitude, status
                FROM sensor_locations
                """
            ).fetchall()
        return rows or None
    except Exception as exc:  # noqa: BLE001
        log.warning("sensors query failed: %s", exc)
        return None
    finally:
        conn.close()


def fetch_refuges() -> list[dict] | None:
    conn = _connect()
    if conn is None:
        return None
    try:
        with conn:
            rows = conn.execute(
                "SELECT name, kind, lat, lon FROM refuge_spaces"
            ).fetchall()
        return rows or None
    except Exception as exc:  # noqa: BLE001
        log.warning("refuges query failed: %s", exc)
        return None
    finally:
        conn.close()

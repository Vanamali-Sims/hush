"""Environment configuration. All secrets come from environment variables / .env."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# --- User-supplied (see backend/.env.example) ---
DATABASE_URL: str | None = os.environ.get("DATABASE_URL") or None
ORS_API_KEY: str | None = os.environ.get("ORS_API_KEY") or None

# Comma-separated list of allowed frontend origins; "*" allows all (fine for a
# public read-only API, tighten to your deployed frontend URL if you prefer).
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()
]

# --- Data sources (overridable, sensible defaults) ---
MELBOURNE_PORTAL = os.environ.get(
    "MELBOURNE_PORTAL", "https://data.melbourne.vic.gov.au/api/explore/v2.1"
)
PAST_HOUR_DATASET = "pedestrian-counting-system-past-hour-counts-per-minute"
ORS_BASE_URL = os.environ.get("ORS_BASE_URL", "https://api.openrouteservice.org")

# --- Behaviour tuning ---
SENSOR_MATCH_RADIUS_M = 50.0  # AC 1.1.2: sensors within 50 m of the path
SEGMENT_LENGTH_M = 120.0  # route is chunked into ~120 m segments for no-data reporting
READING_WINDOW_MIN = 20  # people/min averaged over the most recent N minutes
FEED_CACHE_TTL_S = 300  # in-memory cache of the live feed
ROUTE_CACHE_TTL_S = 600  # in-memory cache of ORS responses per origin/destination
DB_READINGS_MAX_AGE_MIN = 120  # DB readings older than this fall through to next source

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

"""OpenRouteService client: walking routes with alternatives, plus geocoding.

Fallback behaviour ("the demo must not die"):
- Route responses are cached in memory per origin/destination pair.
- If ORS fails and a baked fallback file exists (backend/data/ors_fallback_routes.json,
  created with scripts/make_ors_fallback.py), any request whose origin and
  destination are within 200 m of the baked pair is served from it, clearly
  labelled route_source="fallback".
- Otherwise a RouteServiceError is raised and the API returns a plain-language
  error the frontend shows inline. We never fabricate route geometry.
"""

from __future__ import annotations

import json
import logging
import time

import httpx

from . import config, places
from .geo import haversine_m

log = logging.getLogger(__name__)


class RouteServiceError(Exception):
    """Raised when no route source (live or fallback) can answer."""


_route_cache: dict[tuple, dict] = {}

FALLBACK_FILE = config.DATA_DIR / "ors_fallback_routes.json"
FALLBACK_MATCH_M = 200.0


def _cache_key(from_lat, from_lon, to_lat, to_lon) -> tuple:
    return (round(from_lat, 4), round(from_lon, 4), round(to_lat, 4), round(to_lon, 4))


def _parse_geojson(feature_collection: dict) -> list[dict]:
    routes = []
    for feature in feature_collection.get("features", []):
        props = feature.get("properties", {})
        summary = props.get("summary", {})
        # Dominant street name = the named step covering the most distance.
        street_dist: dict[str, float] = {}
        for segment in props.get("segments", []):
            for step in segment.get("steps", []):
                name = (step.get("name") or "").strip()
                if name and name != "-":
                    street_dist[name] = street_dist.get(name, 0.0) + float(
                        step.get("distance") or 0
                    )
        via = max(street_dist, key=street_dist.get) if street_dist else None
        routes.append(
            {
                "via": via,
                "duration_s": float(summary.get("duration") or 0),
                "distance_m": float(summary.get("distance") or 0),
                "coordinates": [
                    (float(lon), float(lat))
                    for lon, lat, *_ in feature["geometry"]["coordinates"]
                ],
            }
        )
    return routes


def _try_fallback(from_lat, from_lon, to_lat, to_lon) -> list[dict] | None:
    if not FALLBACK_FILE.exists():
        return None
    try:
        doc = json.loads(FALLBACK_FILE.read_text(encoding="utf-8"))
        baked_from = doc["from"]
        baked_to = doc["to"]
        if (
            haversine_m(from_lat, from_lon, baked_from["lat"], baked_from["lon"])
            <= FALLBACK_MATCH_M
            and haversine_m(to_lat, to_lon, baked_to["lat"], baked_to["lon"])
            <= FALLBACK_MATCH_M
        ):
            return _parse_geojson(doc["response"])
    except Exception as exc:  # noqa: BLE001
        log.warning("fallback route file unusable: %s", exc)
    return None


def fetch_routes_raw(from_lat, from_lon, to_lat, to_lon) -> dict:
    """One live ORS call returning the raw GeoJSON FeatureCollection."""
    if not config.ORS_API_KEY:
        raise RouteServiceError("no ORS API key configured")
    resp = httpx.post(
        f"{config.ORS_BASE_URL}/v2/directions/foot-walking/geojson",
        headers={"Authorization": config.ORS_API_KEY},
        json={
            "coordinates": [[from_lon, from_lat], [to_lon, to_lat]],
            "alternative_routes": {
                "target_count": 3,
                "share_factor": 0.6,
                "weight_factor": 1.6,
            },
            "instructions": True,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def get_routes(from_lat, from_lon, to_lat, to_lon) -> tuple[list[dict], str]:
    """Returns (routes, route_source) where route_source is live|cache|fallback."""
    key = _cache_key(from_lat, from_lon, to_lat, to_lon)
    cached = _route_cache.get(key)
    if cached and time.monotonic() - cached["at"] < config.ROUTE_CACHE_TTL_S:
        return cached["routes"], "cache"

    try:
        routes = _parse_geojson(fetch_routes_raw(from_lat, from_lon, to_lat, to_lon))
        if routes:
            _route_cache[key] = {"at": time.monotonic(), "routes": routes}
            return routes, "live"
    except Exception as exc:  # noqa: BLE001
        log.warning("ORS request failed: %s", exc)

    if cached:  # expired cache beats nothing
        return cached["routes"], "cache"

    fallback = _try_fallback(from_lat, from_lon, to_lat, to_lon)
    if fallback:
        return fallback, "fallback"

    raise RouteServiceError("route service unavailable and no fallback matches")


def geocode(text: str, limit: int = 5) -> list[dict]:
    """ORS/Pelias geocoding scoped to central Melbourne; curated list otherwise."""
    if config.ORS_API_KEY:
        try:
            resp = httpx.get(
                f"{config.ORS_BASE_URL}/geocode/search",
                params={
                    "api_key": config.ORS_API_KEY,
                    "text": text,
                    "size": limit,
                    # Bounding box around greater central Melbourne
                    "boundary.rect.min_lon": 144.90,
                    "boundary.rect.min_lat": -37.86,
                    "boundary.rect.max_lon": 145.02,
                    "boundary.rect.max_lat": -37.77,
                },
                timeout=15,
            )
            resp.raise_for_status()
            features = resp.json().get("features", [])
            results = [
                {
                    "label": f["properties"].get("label", text),
                    "lat": f["geometry"]["coordinates"][1],
                    "lon": f["geometry"]["coordinates"][0],
                }
                for f in features
            ]
            if results:
                return results
        except Exception as exc:  # noqa: BLE001
            log.warning("geocode failed, using curated places: %s", exc)
    return places.search(text, limit)

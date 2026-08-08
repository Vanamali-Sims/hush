"""Hush API — sensory-aware wayfinding for Melbourne CBD.

Endpoints:
  GET  /health            liveness (used by the keep-alive ping)
  GET  /api/status        data freshness / configuration overview
  GET  /api/places        curated CBD places for search suggestions
  GET  /api/geocode       place search (database first, ORS Pelias, curated fallback)
  POST /api/routes        walking routes with sensory-load scoring
  GET  /api/refuges       nearest quiet spaces
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config, data_source, db, ors, places
from .geo import haversine_m
from .scoring import score_route

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Hush API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Point(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    label: str | None = None


class RouteRequest(BaseModel):
    from_: Point = Field(alias="from")
    to: Point

    model_config = {"populate_by_name": True}


def _data_age_min(as_of: datetime | None) -> int | None:
    if as_of is None:
        return None
    now = datetime.now(timezone.utc)
    if as_of.tzinfo is None:
        as_of = as_of.replace(tzinfo=timezone.utc)
    return max(0, int((now - as_of).total_seconds() // 60))


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/status")
def status():
    readings, as_of, source = data_source.get_readings()
    return {
        "sensors_reporting": len(readings),
        "data_source": source,
        "data_as_of": as_of.isoformat() if as_of else None,
        "data_age_min": _data_age_min(as_of),
        "database_configured": bool(config.DATABASE_URL),
        "ors_configured": bool(config.ORS_API_KEY),
    }


@app.get("/api/places")
def list_places():
    return {"places": places.PLACES}


@app.get("/api/geocode")
def geocode(text: str = Query(min_length=2, max_length=100)):
    db_hits = db.search_landmarks(text)
    if db_hits:
        return {
            "results": [
                {
                    "label": r["feature_name"],
                    "lat": float(r["latitude"]),
                    "lon": float(r["longitude"]),
                }
                for r in db_hits
            ]
        }
    return {"results": ors.geocode(text)}


@app.post("/api/routes")
def plan_routes(req: RouteRequest):
    origin, dest = req.from_, req.to
    if haversine_m(origin.lat, origin.lon, dest.lat, dest.lon) < 50:
        raise HTTPException(
            status_code=400,
            detail="The start and end points are the same place. Choose two different places.",
        )

    try:
        raw_routes, route_source = ors.get_routes(origin.lat, origin.lon, dest.lat, dest.lon)
    except ors.RouteServiceError:
        raise HTTPException(
            status_code=503,
            detail=(
                "The route service is not available right now. "
                "Your saved places and threshold are unaffected. Try again in a minute."
            ),
        )

    readings, as_of, data_src = data_source.get_readings()
    sensors = data_source.get_sensors()

    routes = []
    for i, r in enumerate(raw_routes):
        scored = score_route(r["coordinates"], sensors, readings)
        routes.append(
            {
                "id": i,
                "via": r["via"],
                "duration_min": round(r["duration_s"] / 60),
                "distance_m": round(r["distance_m"]),
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[lon, lat] for lon, lat in r["coordinates"]],
                },
                **scored,
            }
        )

    # AC 1.1.3: all routes shown, none excluded, sorted by soonest arrival.
    routes.sort(key=lambda r: r["duration_min"])

    return {
        "routes": routes,
        "route_source": route_source,
        "data": {
            "source": data_src,
            "as_of": as_of.isoformat() if as_of else None,
            "age_min": _data_age_min(as_of),
        },
    }


@app.get("/api/refuges")
def nearest_refuges(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    limit: int = Query(default=3, ge=1, le=10),
):
    refuges = data_source.get_refuges()
    for r in refuges:
        r["distance_m"] = round(haversine_m(lat, lon, float(r["lat"]), float(r["lon"])))
    refuges.sort(key=lambda r: r["distance_m"])
    return {"refuges": refuges[:limit]}

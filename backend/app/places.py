"""Curated Melbourne CBD places for search suggestions and the no-key
geocoding fallback. Coordinates checked against OpenStreetMap."""

PLACES = [
    {"label": "Melbourne Central Station", "lat": -37.8100, "lon": 144.9628},
    {"label": "Flinders Street Station", "lat": -37.8183, "lon": 144.9671},
    {"label": "Flinders Lane", "lat": -37.8167, "lon": 144.9655},
    {"label": "Southern Cross Station", "lat": -37.8184, "lon": 144.9525},
    {"label": "Parliament Station", "lat": -37.8110, "lon": 144.9730},
    {"label": "Flagstaff Station", "lat": -37.8118, "lon": 144.9560},
    {"label": "State Library Victoria", "lat": -37.8098, "lon": 144.9646},
    {"label": "Bourke Street Mall", "lat": -37.8136, "lon": 144.9631},
    {"label": "Queen Victoria Market", "lat": -37.8076, "lon": 144.9568},
    {"label": "Federation Square", "lat": -37.8180, "lon": 144.9691},
    {"label": "Degraves Street", "lat": -37.8177, "lon": 144.9656},
    {"label": "Carlton Gardens", "lat": -37.8047, "lon": 144.9717},
    {"label": "Flagstaff Gardens", "lat": -37.8104, "lon": 144.9544},
    {"label": "Treasury Gardens", "lat": -37.8132, "lon": 144.9772},
    {"label": "Melbourne Town Hall", "lat": -37.8152, "lon": 144.9666},
    {"label": "RMIT University (City campus)", "lat": -37.8080, "lon": 144.9634},
    {"label": "Emporium Melbourne", "lat": -37.8118, "lon": 144.9637},
    {"label": "Chinatown (Little Bourke St)", "lat": -37.8117, "lon": 144.9690},
]


def search(text: str, limit: int = 5) -> list[dict]:
    """Case-insensitive substring match over the curated list."""
    needle = text.strip().lower()
    if not needle:
        return []
    hits = [p for p in PLACES if needle in p["label"].lower()]
    return hits[:limit]

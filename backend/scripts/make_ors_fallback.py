"""Bake a fallback route response for the demo origin/destination pair.

Run this ONCE after adding your ORS_API_KEY to backend/.env:

    python backend/scripts/make_ors_fallback.py

It stores the real ORS response for Melbourne Central -> Flinders Lane in
backend/data/ors_fallback_routes.json. If ORS is ever down or rate-limited
during a demo, requests near this pair are served from the baked response
(clearly labelled as fallback). We never fabricate geometry.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config, ors  # noqa: E402

FROM = {"label": "Melbourne Central Station", "lat": -37.8100, "lon": 144.9628}
TO = {"label": "Flinders Lane", "lat": -37.8167, "lon": 144.9655}


def main() -> int:
    if not config.ORS_API_KEY:
        print("Set ORS_API_KEY in backend/.env first.", file=sys.stderr)
        return 1

    response = ors.fetch_routes_raw(FROM["lat"], FROM["lon"], TO["lat"], TO["lon"])
    n_routes = len(response.get("features", []))
    out = config.DATA_DIR / "ors_fallback_routes.json"
    out.write_text(
        json.dumps(
            {
                "baked_at": datetime.now(timezone.utc).isoformat(),
                "from": FROM,
                "to": TO,
                "response": response,
            },
            indent=1,
        ),
        encoding="utf-8",
    )
    print(f"baked {n_routes} routes to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

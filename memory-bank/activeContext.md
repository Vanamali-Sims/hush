# Active Context — hush

Updated: 2026-08-05

## What this project is

"hush" — sensory-aware wayfinding web app for Melbourne CBD (uni project, 5120).
Target user: neurodivergent / sensory-sensitive commuters (persona "Freddy").
Routes are scored against live City of Melbourne pedestrian sensor data and
badged LOW/HIGH against a user-set people/min threshold. Scope is Epic 1
(US1.1 sensory indicator + US1.2 avoid congestion); US1.3, push alerts and the
construction layer are deferred. Full plan in `PLAN.md` (root).

## Current state: BUILD COMPLETE, NOT YET DEPLOYED

Everything is implemented, tested locally (18 pytest passing, frontend builds
and lints clean) and committed to `main`. Remaining work is deployment, which
needs the owner's accounts/keys:

1. Get ORS key (account.heigit.org) → `backend/.env` → run
   `backend/scripts/make_ors_fallback.py` once and commit the result.
2. Create Neon DB → `DATABASE_URL` in `backend/.env` → run `scripts/seed.py`
   and `scripts/sync_feed.py`.
3. Push to GitHub (public repo), set Actions secret `DATABASE_URL` and
   variable `BACKEND_URL`.
4. Render → New → Blueprint (`render.yaml`), set env vars per README.

## Key decisions (do not re-litigate without reason)

- DB is Neon free tier, NOT Render Postgres (30-day expiry) and NOT Supabase
  (7-day pause). Hard requirement to use a database is satisfied.
- Sync job = GitHub Actions cron (Render has no free cron). Keep-alive ping
  workflow prevents Render free-tier cold starts.
- Map = MapLibre GL via @vis.gl/react-maplibre (v8.x) + OpenFreeMap positron
  tiles (no key). Leaflet deliberately dropped.
- UI is sensory-first: no animation anywhere, muted palette (sage LOW / amber
  HIGH, never red), Atkinson Hyperlegible, no modals/toasts, literal copy,
  badges always colour + text, data age always shown honestly.
- Threshold + favourites live in localStorage only; no auth (AC 1.2.5).
- Fallback chain everywhere: DB → live feed → committed snapshot; ORS →
  cache → baked demo pair → plain-language inline error.

## Data facts learned

- Past-hour dataset fields: location_id, sensing_datetime, direction_1/2,
  total_of_directions. Actually retains ~3 days, ~99 sensors reporting.
  Feed lag observed ~20-40 min. Update cadence 15 min.
- Sensor locations: 134 sensors, fields include location_id, sensor_description,
  latitude/longitude, status.
- No usable "open space" dataset on the portal; refuges derived from the
  landmarks dataset (parks, library, worship, galleries) → 88 places.
- ODSQL server-side filter works: `where=sensing_datetime>=now(minutes=-90)`.

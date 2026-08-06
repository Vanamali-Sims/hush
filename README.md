# hush — sensory-aware wayfinding for Melbourne CBD

Plan walking routes through the CBD scored by **sensory load**, not just travel
time. Each route gets a LOW / HIGH badge against **your own** people-per-minute
threshold, scored live from the City of Melbourne Pedestrian Counting System
(134 sensors). Includes a "Quiet space now" refuge finder. Built for
neurodivergent and sensory-sensitive users: no animation, muted colours, plain
language, nothing hidden, nothing sudden.

- **Frontend:** React + Vite + MapLibre GL (OpenFreeMap tiles — no key needed)
- **Backend:** Python + FastAPI
- **Database:** PostgreSQL (Neon free tier)
- **Routing:** OpenRouteService (free key)
- **User data:** browser localStorage only — no accounts, no login

## Accessibility & sensory design

The UI is tuned for neurodivergent and sensory-sensitive users, grounded in the
research in [context/ui_considerations.md](context/ui_considerations.md):

- **Readable text:** 18 px Atkinson Hyperlegible baseline, 1.6 line height, subtle
  letter spacing, left-aligned, with prose capped to a short line length so
  nothing becomes a wall of text (dyslexia reading research).
- **Calm palette:** warm off-white surfaces (never pure white), soft charcoal text
  (never pure black), muted sage for LOW and amber for HIGH — never alarm-red.
- **Meaning three ways:** every badge pairs colour + text + a literal icon
  (leaf = LOW, caution = HIGH, dash = NO DATA), so no single channel is required.
- **One clear choice:** the calmest route is marked "Calmest of these" and given
  more visual weight; the rest are gently muted. All routes are always shown.
- **Predictable & steady:** "Step 1 / Step 2" section labels, a reserved-space
  loading skeleton (no layout shift), an `aria-live` status while searching, no
  animation anywhere, full keyboard navigation, and honest data-age labels.

These are baked-in defaults — no settings panel to configure.

## Quick start (local)

You need Node 20+, Python 3.12+, and two free API resources:

| What | Where to get it | Goes in |
|---|---|---|
| OpenRouteService API key | https://account.heigit.org (free, no card) | `backend/.env` → `ORS_API_KEY` |
| Neon Postgres connection string (optional locally) | https://neon.tech (free, no card) | `backend/.env` → `DATABASE_URL` |

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env    # then edit .env and add your keys
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

API runs at http://localhost:8000 (interactive docs at `/docs`).

The backend works even with an **empty `.env`**: it reads the live pedestrian
feed directly, or the bundled snapshot if that fails. Without `ORS_API_KEY`,
route planning returns a clear error (see Fallbacks below) — everything else
still works.

### 2. Frontend

```powershell
cd frontend
npm install
copy .env.example .env    # default points at http://localhost:8000
npm run dev
```

Open http://localhost:5173.

### 3. Database (once you have a Neon string)

```powershell
cd backend
.\.venv\Scripts\python scripts\seed.py       # creates tables, seeds sensors + refuges
.\.venv\Scripts\python scripts\sync_feed.py  # pulls the last 90 min of readings
```

### 4. Bake the demo fallback (recommended)

After adding `ORS_API_KEY`, run once:

```powershell
.\.venv\Scripts\python scripts\make_ors_fallback.py
```

This saves a real ORS response for Melbourne Central → Flinders Lane, so that
exact demo trip still works even if ORS is down or rate-limited on the day.
Commit the generated `backend/data/ors_fallback_routes.json`.

## Deployment ($0)

### Render (backend + frontend)

1. Push this repo to GitHub (keep it **public** — scheduled Actions minutes are
   unlimited on public repos).
2. Render dashboard → **New → Blueprint** → pick this repo. It reads
   [render.yaml](render.yaml) and creates:
   - `hush-api` — free web service (FastAPI)
   - `hush` — free static site (React build)
3. In `hush-api` → Environment: set `DATABASE_URL` and `ORS_API_KEY`.
4. In `hush` → Environment: set `VITE_API_URL` to the `hush-api` URL, then
   redeploy the static site so the build picks it up.
5. Optional hardening: set `CORS_ORIGINS` on `hush-api` to the static site URL.

### GitHub repository settings (Actions)

| Setting | Type | Value |
|---|---|---|
| `DATABASE_URL` | Secret (Settings → Secrets → Actions) | Neon connection string |
| `BACKEND_URL` | Variable (Settings → Variables → Actions) | e.g. `https://hush-api.onrender.com` |

Three workflows are included:

- **Sync pedestrian data** — every 20 min, pulls the feed into Neon, prunes
  rows older than 24 h (keeps the DB tiny).
- **Keep backend awake** — pings `/health` every 10 min so Render's free tier
  never cold-starts (~720 h/month, inside the 750 free hours).
- **Backend tests** — pytest on every push/PR touching `backend/`.

## Fallbacks (what happens when things break)

| Failure | Behaviour |
|---|---|
| Neon DB down / not configured | Backend fetches the live CoM feed directly (5 min in-memory cache) |
| Live feed also down | Bundled snapshot in `backend/data/` is used; UI says "saved copy" with its age |
| ORS down / rate-limited | Cached responses are served; the baked demo pair works from `ors_fallback_routes.json`; anything else shows a plain-language inline error |
| Geolocation denied | UI says so calmly and uses typed input / central Melbourne |
| No sensor near a route | Badge is NO DATA — never assumed calm (AC 1.1.5) |

The UI always shows the data source and age. It never pretends data is fresher
than it is.

## Tests & code quality

```powershell
cd backend; .\.venv\Scripts\python -m pytest tests -q   # 18 tests, map to the ACs
cd frontend; npm run lint; npm run format
```

## Project structure

```
backend/
  app/            FastAPI app: main, ors (routing), scoring, geo, data_source,
                  db, places, config
  data/           committed fixtures: sensors, readings snapshot, refuges
  scripts/        schema.sql, seed.py, sync_feed.py, make_ors_fallback.py,
                  fetch_fixtures.py
  tests/          pytest suite (scoring rules + API behaviour)
frontend/
  src/            React app; components/, api.js, badges.js (threshold logic)
.github/workflows sync, keep-alive, tests
render.yaml       one-click Render blueprint (both services, free tier)
PLAN.md           the build plan this implements
```

## Data sources & credits

- [Pedestrian Counting System — Past Hour](https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-past-hour-counts-per-minute/) and [Sensor Locations](https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-sensor-locations/) — City of Melbourne Open Data (CC BY)
- Refuge spaces derived from City of Melbourne landmarks data (parks, libraries, places of worship, galleries)
- Routing by [OpenRouteService](https://openrouteservice.org) · Map tiles by [OpenFreeMap](https://openfreemap.org) · Map data © OpenStreetMap contributors
- Typeface: [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/)

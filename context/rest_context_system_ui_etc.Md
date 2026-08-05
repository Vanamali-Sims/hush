# Hush — Sensory-Aware Wayfinding (Melbourne CBD)

Reference document describing the app screens and project slides provided as source material.

---

## 1. App Screen — Trip Planner + Map (Desktop)

**Header:** "hush · Sensory-aware wayfinding · Melbourne CBD"
Top-right controls: "My threshold 100 people/min · Adjust" and "Live · Past Hour feed · 18 min ago"

**Left panel — Plan a Trip**
- **From:** Melbourne Central Station *(tagged "Current location")*
- **To:** Flinders Lane, Melbourne CBD
- Button: **Find calmer routes** (black, full width)

**3 Routes** *(sorted by soonest arrival)*

| Route | Time | Arrival | Badge | Avg. density | Notes |
|---|---|---|---|---|---|
| Via Bourke St Mall | 12 min | 9:00 am | **HIGH** | 148 people/min | "Worst point on this route" — *Show* |
| Via Little Collins St | 14 min | 9:02 am | **LOW** | 62 people/min | "Worst point on this route" — *Hide* (expanded) |
| Via Flinders Ln & Degraves St | 17 min | 9:05 am | **LOW** | 41 people/min | 2 of 7 segments — NO DATA; "Worst point on this route" — *Show* |

**Expanded detail (Little Collins St route):**
> **141 people/min — Elizabeth St at Bourke St**
> More than double this route's average, and above your 100/min threshold. The badge stays Low — the average still describes the whole trip.

**Right panel — Map**
- Labeled endpoints: "Melbourne Central" (top) and "Flinders Lane" (bottom right)
- Two colored route lines plotted on a street grid: an orange/brown route and a green route, each with circular sensor-node markers along the path
- Callout box (top right): **"SENSOR COVERAGE"** — Scoring uses City of Melbourne pedestrian sensors within 50 m of each path segment. 134 sensors cover the CBD but not every laneway — uncovered segments are marked "No data," never assumed calm.
- Map annotation bubble: **"141 people/min — Elizabeth St at Bourke St"** / "Worst single sensor · Via Little Collins St"
- Map label: **"NO DATA — no sensor within 50 m"** on an unmatched segment

**Legend (bottom of map):**
- **LOW** — Route average is at or below your threshold of 100 people/min.
- **HIGH** — Route average is above 100 people/min.
- **⚠ (warning icon)** — This route's worst single sensor is above the threshold, if more than double the route's own average. Shown on every route.
- **NO DATA** — No sensor within 50 m of that segment. Silently counted as Low.

---

## 2. App Screen — Three-Panel Flow (Mobile-Style, Slide 06)

Three sequential panels showing the user flow, with panel 1 highlighted in a purple outline box.

**Panel 1 — "hush · Melbourne CBD"**
- Title: "Plan a trip"
- From: Melbourne Central Station *(Current location)*
- To: Flinders Lane
- Button: **Find calmer routes** (black)
- Secondary card below: **"Quiet space now"** — "Nearest refuge, one tap"

**Panel 2 — Route results (expanded)**
- Top: "← Back"
- Header: "3 routes" / "Sorted by arrival. All routes are shown — none are hidden from you."
- Same three routes as Screen 1 (Bourke St Mall HIGH 148, Little Collins St LOW 62 with the 141 people/min worst-point detail expanded, Flinders Ln LOW 41 with 2 of 7 segments no data)

**Panel 3 — Route results (collapsed)**
- Header: "3 routes" / "Sorted by arrival"
- Same three routes, each showing a "Show" link instead of expanded detail

---

## 3. Slide 03 — "Who Experiences The Problem"

**Persona card (left):**
- Photo: a young man riding public transport
- **Freddy, 28, Marketer**
- Neurodivergent · Sensory Sensitive
- **Goal:** Commute independently through Melbourne's CBD using quieter routes and refuge spaces while reducing sensory overload, anxiety and planning effort.

**Empathy map (right)** — four quadrants around a central brain icon:
- **DOES:** Leaves 40 min early to avoid the crowd. Memorises a handful of quiet backstreets. Abandons trips midroute.
- **THINKS:** "If I ask for adjustments again, I become the difficult one." / "Is there any protest happening today?"
- **SAYS:** "I'm fine, it's just a loud day." · "Can we go somewhere quieter?" · "I'll have to allocate time to figure out the best route."
- **FEELS:** Before commuting, experienced anxiety. Energy depletion on arrival. Loss of independence.

**Issues identified (bottom row):**
1. **Issue 01:** No quick route planning → showcase routes and allocate high/low sensory levels based on threshold.
2. **Issue 02:** No recommendations of nearby refuge — locations surfaced on demand.
3. **Issue 03:** No early warnings → predictive alerts, generated from historical and live data.

---

## 4. Slide 07 — "Plan for This Iteration"

**Subtitle:** Scope: Epic 1 (US1.1 & US1.2)

Four columns:

| | Title | Description | Tag |
|---|---|---|---|
| **Epic 1** | Sensory-Aware Routing | Navigate the CBD on routes optimised for lower sensory load, not shortest travel time. | Gate: 8 DoD items |
| **US 1.1 · Must Have** | Sensory indicator | See a High or Low indicator per route, so I can pick the path that feels safest. | Benefit: No more guessing |
| **US 1.2 · Must Have** | Avoid congestion | Avoid highly congested corridors, so I reduce exposure to crowd related stress. | Benefit: One app |
| **US 1.3 · Should Have** | Peak-hour reroute | Lower-stimulation alternatives when density passes my own threshold at peak hour. | Benefit: Reaching the finish line |

---

## 5. Slide 08 — "US 1.1 — Acceptance Criteria: Sensory Indicator"

| AC # | Title | Description | Given / Constraint |
|---|---|---|---|
| **AC 1.1.1** | Route generation | OpenRouteService returns up to 3 alternative routes, each with duration and path. | Given origin + destination |
| **AC 1.1.2** | Scoring & threshold | Match each path to sensors within 50 m. Score is the average of matched readings. Above 100 is High. | Threshold is user-set |
| **AC 1.1.3 – 1.1.4** | Display & legend | All routes shown, none excluded, sorted by soonest arrival duration, average and badge on each. | No route is hidden |
| **AC 1.1.5 – 1.1.6** | No data & worst point | No sensor within 50 m is marked No data, never Low. An accordion shows the worst reading and its street. | Flag only on true outliers |

Each column is paired with a small screenshot: the route list, the threshold/live feed control, and the map with the "141 people/min" callout.

---

## 6. Slide 09 — "US 1.2 — Acceptance Criteria: Avoid Congestion"

| AC # | Title | Description | Given / Constraint |
|---|---|---|---|
| **AC 1.2.1** | Search & default | The home page shows a location search box, defaulting to current location when GPS is on. | Given the app opens |
| **AC 1.2.2 – 1.2.3** | Override & saved | User can change the location and apply filters. Saved favourites appear for quick selection. | No login required |
| **AC 1.2.4** | Map render | With origin and destination set, the map shows the routes and labels US 1.1 produced. | Renders, never recomputes |
| **AC 1.2.5** | Save a place | Add to favourites stores the location on the device for future trips. | Stays on the device |

Paired screenshots: the "Plan a trip" form and the route map.

---

## 7. Slide 12 — "High Level Architecture"

**Proposed Tech Stack and External Sources:**
- **Frontend:** React or Vue.js, Leaflet.js (maps)
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL (Render, free tier)
- **Client storage:** Browser localStorage
- **Routing API:** OpenRouteService (free, no card required)
- **Data APIs:**
  - data.gov.au (Pedestrian Counting System)
  - melbourne.vic.gov.au (Open Space data, Development Activity Monitor)
- **Hosting:** Render (frontend, backend, database)

**Architecture diagram (same structure as documented separately):**
User → Frontend (map, search, alerts, refuge finder, construction work) ↔ Local storage (prefs and favourites)
Frontend ↔ Application layer (business logic services: Route Service, Alert Service, Threshold engine, Refuge locator)
Application layer → Data layer (sync job, PostgreSQL database with cache layer), and to the External API (OpenRouteService routing engine)
Data layer → External data sources (Pedestrian data – data.gov.au; Open space data – melbourne.vic.gov.au; Development Activity Monitor – melbourne.vic.gov.au), all live government data.

*(Full diagram breakdown available in the separate `architecture-overview.md` file.)*

---

## 8. Slide 13 — "Code Quality"

| Practice | How It Is Enforced |
|---|---|
| **Version control** | GitHub, one feature branch per acceptance criterion. Pull requests required before merging to main. |
| **Review** | ESLint + Prettier (frontend), Black + Ruff (backend). Environment variables in `.env`, never committed. |
| **Testing** | Pytest for backend unit tests. Tests map directly onto Gherkin acceptance criteria — each Given/When/Then is already written as a testable case. |
| **Definition of Done** | The mentors' own epic DoD lists, approved at the gate, never self-assessed. |
| **Modularity** | Four logical modules (Route service, Threshold engine, Refuge locator, Alert service) within one FastAPI app, not scattered logic. |
| **Documentation** | README covering setup, required env variables, and test instructions. Comments explain why, not what — particularly around deliberate scope decisions. |
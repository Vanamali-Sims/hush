# Hush — Build Plan (Iteration 2 draft)

Revision of [PLAN.md](PLAN.md). Same product (sensory-aware wayfinding, Melbourne CBD), same scope (Epic 1 — US1.1 + US1.2), but the UI is redesigned around the actual target user — Freddy: neurodivergent, sensory-sensitive, prone to anxiety and decision fatigue — instead of a generic "clean dashboard" look. Planning only; no code in this pass.

**Locked (non-negotiable, per direction):**
1. Database is PostgreSQL.
2. Infrastructure is $0 — free tiers only.
3. Coding conventions (§7) are followed, not treated as optional.

**Not locked / this pass explicitly revisits:** hosting provider choices, build order, screen layout, copy, color system, component structure. Git workflow (branches/PRs) is deferred — this repo is a scratch/test repo; a real repo and commit plan come later.

---

## 1. Stack

Unchanged from PLAN.md — it already satisfies the three locked constraints, and the reasoning holds up:

| Component | Choice | Why it stays |
|---|---|---|
| Database | PostgreSQL on **Neon free tier** | Locked requirement (Postgres) + genuinely free with no expiry — Render's free Postgres dies at 30 days, Supabase free pauses after 7 idle days. Neon is the only option that's both. |
| Backend | Python + FastAPI | Render free web service (750 hrs/mo covers 24/7) |
| Frontend | React + Vite + Leaflet.js | Static site, deployed separately, never sleeps |
| Sync job | GitHub Actions scheduled workflow | Render free tier has no cron |
| Routing | OpenRouteService | Free key, server-side only |
| Live data | City of Melbourne Opendatasoft API v2.1 | `data.melbourne.vic.gov.au` |
| Client prefs | Browser localStorage | No login, per AC 1.2.5 |

No changes proposed here. If this gets revisited, it should be because something in testing breaks (e.g. ORS quota), not for its own sake.

---

## 2. The actual problem with the current design

Looking at the wireframes in [context/image.png](context/image.png) and [context/mobile_display_ui.png](context/mobile_display_ui.png) against the persona in [context/rest_context_system_ui_etc.Md](context/rest_context_system_ui_etc.Md) (§3, Freddy — "leaves 40 min early," "energy depletion on arrival," "loss of independence"), the current screens are clean by *conventional* SaaS-dashboard standards but not by sensory-load standards. Concretely:

- **Everything is visible at once.** 3 full route cards + a map with 2 route lines, sensor dots, a callout bubble, a legend, a threshold control, and a live-feed timestamp — all on screen simultaneously, on first load. For a user whose stated problem is sensory overload, the app's own first screen is a wall of simultaneous stimuli.
- **A "worst point" warning is expanded by default** (Little Collins St, 141 people/min, with a warning icon) on the very first view. The app leads with the most alarming number it has, un-asked-for.
- **Orange is used for both "HIGH" and "warning"** — orange/amber is a high-arousal, alert-associated color; using it as the default resting state for one of two possible badges (not an error state) raises baseline arousal for no reason.
- **Numbers are the primary content.** "148 people/min," "62 people/min," "141 people/min" are the biggest, boldest text on the route cards. Raw density numbers require the user to do comparison/interpretation work (is 62 good? how good?) — that cognitive step is exactly the "planning effort" the persona is trying to reduce.
- **Three routes compete for attention with equal visual weight.** No default recommendation — the user has to compare three cards themselves every single time, which is the decision-fatigue problem restated, not solved.
- **Map is busy by default**: both routes, all matched sensor dots, and a callout bubble render at once rather than progressively.

None of this is a criticism of the wireframe as a wireframe — it's a reasonable first pass and it does hit every acceptance criterion. The redesign below keeps every AC intact and changes *only* presentation defaults and information sequencing.

---

## 3. UI redesign principles

1. **Calm-by-default, detail-on-request.** The first thing rendered is the least amount of information that lets the user make a decision. Anything more granular is one deliberate tap away, never pre-expanded.
2. **Lead with a recommendation, not a comparison.** One route is surfaced as primary ("Calmest route"); the other alternatives are present but visually secondary and collapsed. AC 1.1.3/1.1.4 ("all routes shown, none hidden, sorted by arrival") is still satisfied — collapsed is not hidden, it's one tap away, and order-by-arrival is preserved within the list.
3. **Words before numbers.** "Calmer" / "Busier" is the primary label. The people/min figure is real and still shown, but as secondary/supporting text, not the largest element on the card.
4. **Never color alone.** Every badge pairs an icon/shape + text with the color, so meaning doesn't depend on color perception or on the color's emotional association. (Also fixes a real accessibility gap in the original: color-only badges fail WCAG 1.4.1.)
5. **No unsolicited alarm.** The worst-point/outlier callout is real and useful, but it's opt-in (tap "Show") on every route, with zero exceptions — nothing auto-expands, ever.
6. **One decision at a time.** Trip planning form → results list → route detail is a sequence, not a simultaneous multi-panel layout, on mobile. Desktop can keep list+map side by side (more screen real estate, less forced context-switching), but the map itself follows the same progressive-disclosure rule (see below).
7. **Motion and noise are opt-out, not default.** No pulsing "live" indicators, no auto-refresh flicker, `prefers-reduced-motion` respected everywhere, no sound.
8. **Predictable, not novel.** Fixed layout positions, consistent iconography, no surprise reflow when data loads — surprise is itself a sensory cost.

---

## 4. Concrete screen changes

### Trip planner (entry screen)
- Unchanged structurally: From / To / "Find calmer routes" button / "Quiet space now" shortcut. This screen is already minimal — kept as-is.
- Threshold control and live-feed timestamp move out of the persistent header into a small "Settings" affordance (icon button) — they're configuration, not something that needs to occupy visual space on every screen. Default threshold (100/min) applies silently until the user opens settings.

### Route results list
- Routes sorted by arrival (unchanged, AC 1.1.3), but the **lowest-sensory-load route is visually promoted**: larger card, sits first regardless of arrival-sort position *within its own highlighted slot*, with the remaining routes in a plainer, collapsed list below labeled "2 more routes, sorted by arrival." Tapping expands them inline — nothing is hidden, only deferred.
- Each collapsed route card shows: route name, arrival time, badge (icon + word, e.g. "◔ Calmer" / "◕ Busier" — exact iconography TBD in a design pass), that's it. No people/min figure at this level.
- Tapping a card expands: the people/min average, the worst-point line (still requires its own explicit "Show" tap — expanding the card does not auto-expand the worst-point accordion), and NO DATA segment count if any.
- "NO DATA" segments keep their current meaning (never assumed calm, per AC 1.1.5) but get calmer copy: "No sensor coverage here" instead of a bare all-caps label.

### Map
- Default state: only the promoted/recommended route is drawn, in one calm color, no sensor dots. A small "Show all routes" toggle reveals the others, dimmed relative to the primary.
- Sensor dots and the worst-point callout bubble render only when the user taps into a route's detail (matches the "opt-in detail" rule) — not all at once on load.
- Legend stays, but recolored per the palette change below and moved to not compete with the map content (e.g. a collapsed "?" info affordance rather than a permanent on-canvas block).

### Color / badge system
- Replace orange-for-HIGH with a **muted, low-saturation palette** — e.g. soft slate-blue for "Calmer," muted mustard/clay (not bright orange/red) for "Busier," neutral gray for "No data." Colors chosen for WCAG AA contrast against both light backgrounds and each other, and deliberately desaturated relative to the wireframe's palette so neither state reads as an alert.
- Every badge = icon + word + color (never color alone).
- The worst-point warning icon changes from an orange triangle to a neutral outlined dot/info glyph in the same muted palette — "notable, not alarming."

### Settings (new, small)
- Threshold adjust (existing behavior, relocated here).
- Optional accessibility toggles, localStorage-backed alongside threshold/favourites (no login, consistent with AC 1.2.5): larger text, reduce-motion (mirrors OS setting but overridable), "always show numbers" (for users who *prefer* the raw data up front — some neurodivergent users want more precision, not less; the calm default should be overridable, not forced).

### Copy tone
- Replace clinical/alarm phrasing with plain, calm language throughout. "148 people/min" stays as real data but is never the headline; headline language is comparative and plain ("Calmer than your other options," "Busier than usual").

---

## 5. What does NOT change

- Acceptance criteria AC 1.1.1–1.1.6 and AC 1.2.1–1.2.5 are all still met — this is a presentation/sequencing redesign, not a scope change. Nothing is hidden that AC requires to be shown; "collapsed, one tap away" satisfies "shown, none excluded."
- Data model (`sensor_locations`, `sensor_readings`, `refuge_spaces`) — unchanged, still Postgres/Neon.
- No login, no server-side user accounts — prefs stay in localStorage.
- Scoring logic (50 m matching, average, threshold comparison) — unchanged, purely a backend concern.

---

## 6. Build order (day by day)

Same backend-first sequencing as PLAN.md (deploy skeleton first, data second, routes API third) since that risk-ordering logic still holds. UI days are restructured around the design system rather than screen-by-screen cloning of the wireframe.

- **Day 1 — Walking skeleton, deployed.** Same as before: repo/CI, hello-world FE+BE deployed end-to-end, Neon connected, keep-alive ping running.
- **Day 2 — Data in.** Sync workflow, seed data, scoring function, pytest against fixtures. Unchanged.
- **Day 3 — Routes API.** `POST /routes` wired end to end. Unchanged.
- **Day 4 — Design tokens + calm component set.** Before screen assembly: color palette (contrast-checked), typography scale, icon set for badges/states, motion rules (`prefers-reduced-motion`). This is new relative to PLAN.md — the old plan went straight to "route list UI"; this plan builds the shared vocabulary first so screens 5 doesn't reinvent it per-component.
- **Day 5 — Trip planner + results (progressive-disclosure layout).** Promoted route + collapsed alternatives, opt-in worst-point, opt-in map detail, settings panel with threshold + accessibility toggles in localStorage.
- **Day 6 — Hardening.** Fallback snapshot, data-age display (in Settings, not the header), empty/error states written in the same calm tone, mobile pass, pytest green.
- **Day 7 — Buffer + rehearsal.** Same as before: cold demo rehearsal from a phone, fix what breaks, README.

---

## 7. Conventions (unchanged, kept from PLAN.md)

Locked by direction — not up for revision:

- GitHub, one feature branch per acceptance criterion, PRs before merge to main. *(Deferred in practice: this repo is a test repo; the branch/PR workflow applies once the real project repo exists.)*
- ESLint + Prettier (frontend); Black + Ruff (backend); secrets in `.env`, never committed.
- Pytest tests mapped to Gherkin acceptance criteria.
- Four logical modules inside one FastAPI app: route service, threshold logic, refuge locator, (alerts deferred).
- README covers setup, env vars, and test instructions.

Added, in support of the UI direction (still within "coding conventions," not a scope change):
- Color choices must pass WCAG AA contrast checks before merge — treat this as a lint-equivalent gate, same seriousness as ESLint/Black.
- No component ships an auto-expanding/auto-playing state by default; any exception needs a one-line comment saying why.

---

## 8. Open questions for the team (not blocking this doc, but worth a decision before Day 4)

- Exact icon/shape set for the badge system (needs a quick pass, not deep design work — three states: calmer, busier, no data).
- Whether the "promoted route" logic is simply "lowest average density" or needs a tie-break with arrival time — affects the Day 3 API response shape slightly (may need a `recommended: true` flag added to one route in the response).
- Whether reduce-motion/text-size preferences belong in this iteration's scope or are a fast-follow — they're cheap (CSS + localStorage) so proposal is to include them, but flagging in case time is tighter than expected.

-- Hush database schema (PostgreSQL / Neon free tier)
--
-- No PostGIS: 134 sensors, brute-force Python haversine (app/geo.py) is
-- already correct and unit-tested (each sensor's minimum distance to the
-- whole route is computed once, so there is no per-point double-counting
-- to guard against).

CREATE TABLE IF NOT EXISTS sensor_locations (
    location_id         text PRIMARY KEY,
    sensor_name          text,
    sensor_description   text,
    location_type        text,
    status                text,
    latitude              numeric NOT NULL,
    longitude             numeric NOT NULL,
    direction_1_label    text,
    direction_2_label    text,
    installation_date    date,
    note                  text
);

CREATE TABLE IF NOT EXISTS pedestrian_minute_count (
    location_id           text NOT NULL,
    sensing_datetime      timestamptz NOT NULL,
    direction_1_count     integer,
    direction_2_count     integer,
    total_of_direction    integer GENERATED ALWAYS AS (
                               COALESCE(direction_1_count, 0) + COALESCE(direction_2_count, 0)
                           ) STORED,
    PRIMARY KEY (location_id, sensing_datetime)
);
-- Deliberately no FK to sensor_locations: the 15-minute sync job must never
-- fail its whole batch because the live feed mentions a sensor ID we
-- haven't (re)seeded yet. Application-level reference only.

CREATE INDEX IF NOT EXISTS idx_minute_count_datetime ON pedestrian_minute_count (sensing_datetime);

CREATE TABLE IF NOT EXISTS pedestrian_hour_count (
    location_id           text NOT NULL,
    sensing_datetime      timestamptz NOT NULL,
    hourly_count           integer,
    PRIMARY KEY (location_id, sensing_datetime)
);
-- Historical archive. Not used by live scoring this iteration (reserved for
-- future-time prediction, US2.2) — not synced yet, schema only. Same no-FK
-- reasoning as pedestrian_minute_count above.

CREATE TABLE IF NOT EXISTS refuge_spaces (
    id   serial PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL,
    lat  double precision NOT NULL,
    lon  double precision NOT NULL,
    UNIQUE (name, kind)
);
-- Unchanged. Still the sole source for GET /api/refuges. theme /
-- landmark_category / landmark below are built alongside this table, not
-- instead of it — no endpoint queries them yet.

CREATE TABLE IF NOT EXISTS theme (
    theme_id    serial PRIMARY KEY,
    theme_name  text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS landmark_category (
    category_id      serial PRIMARY KEY,
    sub_theme         text NOT NULL UNIQUE,
    theme_id          integer REFERENCES theme(theme_id),
    is_quiet_space    boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS landmark (
    id              serial PRIMARY KEY,
    category_id      integer REFERENCES landmark_category(category_id),
    feature_name     text NOT NULL,
    latitude          numeric NOT NULL,
    longitude         numeric NOT NULL,
    UNIQUE (feature_name, category_id)
);
-- theme -> landmark_category -> landmark keep enforced FKs: static,
-- seeded-once reference tables, no live-sync risk. Source dataset (City of
-- Melbourne Landmarks and Places of Interest) has no landmark ID field, so
-- the surrogate serial id + UNIQUE(feature_name, category_id) mirrors
-- refuge_spaces' own idempotent-upsert pattern above.

CREATE TABLE IF NOT EXISTS planned_activity (
    activity_id           text PRIMARY KEY,
    street_address         text,
    development_status     text,
    area_name              text,
    latitude                numeric,
    longitude               numeric
);
-- Standalone: no FK to sensor_locations or landmark, joined to a route only
-- at query time via distance, since there's no shared key in the source
-- data. activity_id is the source's development_key (e.g. "X000557") --
-- alphanumeric, not integer. No CHECK on development_status: real values
-- today are COMPLETED / APPROVED / UNDER CONSTRUCTION / APPLIED (verified
-- against the live dataset, 1,438 rows) and a periodic refresh must never
-- fail outright because Melbourne adds a value we didn't anticipate --
-- same reasoning as the missing FK on the readings tables above.
-- Schema only this pass, per the corrections: no endpoint queries it yet.

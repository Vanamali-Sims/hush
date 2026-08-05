-- Hush database schema (PostgreSQL / Neon free tier)

CREATE TABLE IF NOT EXISTS sensor_locations (
    location_id        integer PRIMARY KEY,
    sensor_description text,
    sensor_name        text,
    latitude           double precision NOT NULL,
    longitude          double precision NOT NULL,
    status             text,
    location_type      text
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    location_id         integer     NOT NULL,
    sensing_datetime    timestamptz NOT NULL,
    direction_1         integer,
    direction_2         integer,
    total_of_directions integer,
    PRIMARY KEY (location_id, sensing_datetime)
);

CREATE INDEX IF NOT EXISTS idx_readings_time ON sensor_readings (sensing_datetime);

CREATE TABLE IF NOT EXISTS refuge_spaces (
    id   serial PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL,
    lat  double precision NOT NULL,
    lon  double precision NOT NULL,
    UNIQUE (name, kind)
);

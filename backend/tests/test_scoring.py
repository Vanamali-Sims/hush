"""Unit tests for geo helpers and route scoring, mapped to acceptance criteria.

AC 1.1.2 — sensors within 50 m of the path count; score is the average of
            matched readings.
AC 1.1.5 — segments with no sensor data are counted as No data, never Low.
"""

from datetime import datetime, timedelta, timezone

from app.geo import chunk_polyline, haversine_m, min_distance_to_polyline_m
from app.scoring import aggregate_readings, score_route

# A simple straight test path along Swanston St-ish coordinates (lon, lat).
PATH = [
    (144.9660, -37.8100),
    (144.9660, -37.8120),
    (144.9660, -37.8140),
]


def sensor(loc_id, lat, lon, name="Test sensor"):
    return {
        "location_id": loc_id,
        "sensor_description": name,
        "latitude": lat,
        "longitude": lon,
    }


class TestGeo:
    def test_haversine_known_distance(self):
        # Melbourne Central to Flinders St Station is roughly 1 km.
        d = haversine_m(-37.8100, 144.9628, -37.8183, 144.9671)
        assert 900 < d < 1100

    def test_point_on_polyline_is_zero_distance(self):
        assert min_distance_to_polyline_m(-37.8120, 144.9660, PATH) < 1

    def test_point_50m_off_path(self):
        # ~50 m east of the line (1 deg lon ~ 88 km at this latitude).
        d = min_distance_to_polyline_m(-37.8120, 144.9660 + 50 / 88000, PATH)
        assert 40 < d < 60

    def test_chunking_covers_whole_route(self):
        chunks = chunk_polyline(PATH, target_m=120)
        assert chunks[0][0] == PATH[0]
        assert chunks[-1][-1] == PATH[-1]
        # ~450 m path in ~120 m chunks -> 3-4 chunks
        assert 3 <= len(chunks) <= 4


class TestAggregateReadings:
    def test_people_per_minute_average(self):
        now = datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc)
        rows = [
            {"location_id": 1, "sensing_datetime": now, "total_of_directions": 100},
            {
                "location_id": 1,
                "sensing_datetime": now - timedelta(minutes=1),
                "total_of_directions": 80,
            },
            # Old reading outside the window must be ignored.
            {
                "location_id": 1,
                "sensing_datetime": now - timedelta(hours=3),
                "total_of_directions": 10_000,
            },
        ]
        readings, as_of = aggregate_readings(rows, window_min=20)
        assert readings[1] == 90
        assert as_of == now

    def test_empty_rows(self):
        readings, as_of = aggregate_readings([])
        assert readings == {} and as_of is None


class TestScoreRoute:
    def test_ac_1_1_2_only_sensors_within_50m_match(self):
        sensors = [
            sensor(1, -37.8120, 144.9660),  # on the path
            sensor(2, -37.8120, 144.9700),  # ~350 m away, must not match
        ]
        readings = {1: 60.0, 2: 500.0}
        result = score_route(PATH, sensors, readings)
        assert [s["location_id"] for s in result["matched_sensors"]] == [1]
        assert result["avg_density"] == 60.0

    def test_ac_1_1_2_average_of_matched_readings(self):
        sensors = [
            sensor(1, -37.8105, 144.9660),
            sensor(2, -37.8135, 144.9660),
        ]
        readings = {1: 40.0, 2: 80.0}
        result = score_route(PATH, sensors, readings)
        assert result["avg_density"] == 60.0

    def test_worst_point_reported_with_street(self):
        sensors = [
            sensor(1, -37.8105, 144.9660, name="Swanston St (North)"),
            sensor(2, -37.8135, 144.9660, name="Swanston St (South)"),
        ]
        readings = {1: 40.0, 2: 141.0}
        result = score_route(PATH, sensors, readings)
        assert result["worst"]["value"] == 141.0
        assert result["worst"]["street"] == "Swanston St (South)"

    def test_ac_1_1_5_no_sensor_at_all_means_all_segments_no_data(self):
        result = score_route(PATH, [], {})
        assert result["avg_density"] is None
        assert result["worst"] is None
        assert result["segments_no_data"] == result["segments_total"] > 0

    def test_ac_1_1_5_matched_sensor_without_reading_is_not_assumed_calm(self):
        sensors = [sensor(1, -37.8120, 144.9660)]
        result = score_route(PATH, sensors, readings={})
        # Sensor matched geographically but has no current reading:
        # it must not contribute an average and segments stay no-data.
        assert result["avg_density"] is None
        assert result["segments_no_data"] == result["segments_total"]

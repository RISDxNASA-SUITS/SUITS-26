from app.services.java_telemetry_mapper import build_snapshot, map_co2_status, map_comms_status, map_ltv_status

FIXTURE_BUNDLE = {
    "ev1": {
        "oxy_pri_storage": 88.5,
        "oxy_sec_storage": 91.0,
        "batt_time_left": 76.0,
        "scrubber_a_co2_storage": 10.0,
        "scrubber_b_co2_storage": 15.0,
        "helmet_pressure_co2": 2.0,
    },
    "dcu": {"comms": "A", "battery": "LOCAL", "oxygen": "PRI", "fan": "PRI", "pump": "OPEN", "co2": "A"},
    "errors": {"fan_error": False, "oxy_error": False, "pump_error": False},
    "rover": {"pointOfNoReturn": 120.5, "distanceFromBase": 200.0},
    "ltv": {
        "location": {"last_known_x": -5839.0, "last_known_y": -10460.0},
        "signal": {"strength": -45.0, "ping_requested": False, "ping_unlimited_requested": False},
    },
    "ltv_errors": {"error_procedures": []},
}


def test_build_snapshot_maps_java_fields():
    snap = build_snapshot(FIXTURE_BUNDLE)
    assert snap.primary_o2_pct == 88.5
    assert snap.secondary_o2_pct == 91.0
    assert snap.battery_pct == 76.0
    assert snap.co2_status == "nominal"
    assert snap.comms_status == "nominal"
    assert snap.safe_range_m == 120.5
    assert snap.ltv_status == "idle"


def test_map_co2_status_high_from_scrubber():
    ev1 = dict(FIXTURE_BUNDLE["ev1"], scrubber_a_co2_storage=85.0)
    assert map_co2_status(ev1, FIXTURE_BUNDLE["errors"]) == "high"


def test_map_comms_status_degraded_on_error():
    errors = {"fan_error": True, "oxy_error": False, "pump_error": False}
    assert map_comms_status(FIXTURE_BUNDLE["dcu"], errors) == "degraded"


def test_map_ltv_status_ping_requested():
    ltv = {"signal": {"ping_requested": True, "ping_unlimited_requested": False, "strength": -50.0}}
    assert map_ltv_status(ltv, {"error_procedures": []}) == "ping_requested"


def test_map_ltv_status_fault_when_unresolved_error():
    ltv_errors = {"error_procedures": [{"code": "4155", "needs_resolved": True, "description": "x", "procedures": []}]}
    assert map_ltv_status(FIXTURE_BUNDLE["ltv"], ltv_errors) == "fault"

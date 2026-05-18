"""Shared full Java telemetry bundle fixture for tests."""

from app.models.live_telemetry import LiveTelemetryBundle

FIXTURE_BUNDLE = LiveTelemetryBundle(
    ev1={
        "oxy_pri_storage": 88.5,
        "oxy_sec_storage": 91.0,
        "batt_time_left": 76.0,
        "scrubber_a_co2_storage": 10.0,
        "scrubber_b_co2_storage": 15.0,
        "helmet_pressure_co2": 2.0,
        "heart_rate": 72.0,
    },
    ev2={
        "oxy_pri_storage": 87.0,
        "oxy_sec_storage": 20.0,
        "batt_time_left": 75.0,
        "heart_rate": 165.0,
    },
    dcu1={"comms": "A", "battery": "LOCAL", "oxygen": "PRI", "fan": "PRI", "pump": "OPEN", "co2": "A"},
    dcu2={"comms": "A", "battery": "LOCAL", "oxygen": "PRI", "fan": "SEC", "pump": "OPEN", "co2": "A"},
    errors={"fan_error": False, "oxy_error": False, "pump_error": False},
    imu1={"posx": 0.0, "posy": 0.0, "heading": 0.0},
    imu2={"posx": 1.0, "posy": 1.0, "heading": 90.0},
    uia={"eva1_power": True, "eva2_power": True},
    eva_states={"started": True, "paused": False, "completed": False},
    rover={"pointOfNoReturn": 120.5, "distanceFromBase": 200.0, "batteryLevel": 20.0},
    lidar={"data": [100.0, 200.0]},
    ltv={
        "location": {"last_known_x": -5839.0, "last_known_y": -10460.0},
        "signal": {"strength": -45.0, "ping_requested": False, "ping_unlimited_requested": False},
    },
    ltv_errors={"error_procedures": []},
    polled_at_unix=1_700_000_000.0,
)

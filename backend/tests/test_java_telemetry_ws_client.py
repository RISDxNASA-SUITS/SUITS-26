import json
import threading
import time

from app.services.java_telemetry_ws_client import (
    apply_mission_bundle,
    java_mission_ws_url,
    parse_mission_payload,
)
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service


def test_java_mission_ws_url_derived_from_http():
    url = java_mission_ws_url()
    assert url.endswith("/telemetry/mission/live")
    assert url.startswith("ws://")


def test_parse_mission_payload_minimal():
    raw = json.dumps(
        {
            "polled_at_unix": 1000.5,
            "ev1": {"oxy_pri_storage": 80.0},
            "ev2": {},
            "dcu1": {},
            "dcu2": {},
            "errors": {},
            "imu1": {},
            "imu2": {},
            "uia": {},
            "eva_states": {},
            "rover": {},
            "lidar": {"data": [1.0, 2.0]},
            "ltv": {},
            "ltv_errors": {"error_procedures": []},
        }
    )
    bundle = parse_mission_payload(raw)
    assert bundle.ev1["oxy_pri_storage"] == 80.0
    assert bundle.lidar["data"] == [1.0, 2.0]
    assert bundle.polled_at_unix == 1000.5


def test_apply_mission_bundle_updates_state():
    telemetry_service.seed_training()
    live_telemetry_state.set_ok(False)
    raw = json.dumps(
        {
            "polled_at_unix": time.time(),
            "ev1": {"oxy_pri_storage": 42.0},
            "ev2": {},
            "dcu1": {},
            "dcu2": {},
            "errors": {},
            "imu1": {},
            "imu2": {},
            "uia": {},
            "eva_states": {},
            "rover": {},
            "lidar": {},
            "ltv": {},
            "ltv_errors": {},
        }
    )
    apply_mission_bundle(parse_mission_payload(raw))
    assert live_telemetry_state.is_ok()
    bundle = telemetry_service.get_bundle()
    assert bundle is not None
    assert bundle.ev1["oxy_pri_storage"] == 42.0

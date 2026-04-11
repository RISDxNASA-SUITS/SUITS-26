import json

from app.models.telemetry import TelemetrySnapshot
from app.services.telemetry_json_poller import _read_and_apply
from app.services.telemetry_service import telemetry_service


def test_read_and_apply_valid_file(tmp_path):
    path = tmp_path / "tel.json"
    snap = TelemetrySnapshot(
        primary_o2_pct=50.0,
        secondary_o2_pct=60.0,
        battery_pct=70.0,
        co2_status="nominal",
        comms_status="nominal",
        safe_range_m=100.0,
        ltv_status="idle",
    )
    path.write_text(json.dumps(snap.model_dump()), encoding="utf-8")
    telemetry_service.seed_training()
    _read_and_apply(path)
    got = telemetry_service.get_snapshot()
    assert got.primary_o2_pct == 50.0
    assert got.battery_pct == 70.0


def test_read_and_apply_invalid_json_does_not_raise(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text("{not json", encoding="utf-8")
    telemetry_service.seed_training()
    before = telemetry_service.get_snapshot()
    _read_and_apply(path)
    after = telemetry_service.get_snapshot()
    assert after.primary_o2_pct == before.primary_o2_pct


def test_read_and_apply_missing_file_noop(tmp_path):
    path = tmp_path / "missing.json"
    telemetry_service.seed_training()
    before = telemetry_service.get_snapshot()
    _read_and_apply(path)
    assert telemetry_service.get_snapshot().primary_o2_pct == before.primary_o2_pct

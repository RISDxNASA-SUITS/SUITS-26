from app.models.telemetry import TelemetryUpdate
from app.services.telemetry_service import TelemetryService


def test_default_snapshot_fields():
    svc = TelemetryService()
    svc.seed_training()
    snap = svc.get_snapshot()
    assert snap.primary_o2_pct == 99.0
    assert snap.secondary_o2_pct == 98.5
    assert snap.battery_pct == 87.0
    assert snap.co2_status == "nominal"
    assert snap.comms_status == "nominal"
    assert snap.safe_range_m == 150.0
    assert snap.ltv_status == "idle"


def test_partial_update_preserves_other_fields():
    svc = TelemetryService()
    svc.seed_training()
    new = svc.update(TelemetryUpdate(battery_pct=42.0))
    assert new.battery_pct == 42.0
    assert new.primary_o2_pct == 99.0
    assert new.co2_status == "nominal"


def test_update_co2_and_comms():
    svc = TelemetryService()
    svc.seed_training()
    new = svc.update(TelemetryUpdate(co2_status="elevated", comms_status="degraded"))
    assert new.co2_status == "elevated"
    assert new.comms_status == "degraded"

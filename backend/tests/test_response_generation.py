"""Template composition for status and warnings."""

from app.models.telemetry import TelemetrySnapshot
from app.services.response_generation import (
    status_battery,
    status_oxygen,
    warning_check_summary,
)


def test_status_oxygen_appends_low_warning():
    snap = TelemetrySnapshot(
        primary_o2_pct=10.0,
        secondary_o2_pct=90.0,
        battery_pct=80.0,
        co2_status="nominal",
        comms_status="nominal",
        safe_range_m=100.0,
        ltv_status="idle",
    )
    text = status_oxygen(snap)
    assert "10.0" in text
    assert "Primary O₂ low" in text or "low" in text.lower()


def test_warning_summary_counts():
    snap = TelemetrySnapshot(
        primary_o2_pct=10.0,
        secondary_o2_pct=90.0,
        battery_pct=10.0,
        co2_status="high",
        comms_status="nominal",
        safe_range_m=10.0,
        ltv_status="idle",
    )
    s = warning_check_summary(snap)
    assert "warning" in s.lower()
    assert "warning(s):" in s

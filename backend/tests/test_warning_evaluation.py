from app.models.telemetry import TelemetrySnapshot
from app.services.warning_evaluation import (
    BATTERY_CAUTION_PCT,
    PRIMARY_O2_CAUTION_PCT,
    list_warnings,
)
from tests.fixtures.live_telemetry_bundle import FIXTURE_BUNDLE


def _snap(**kwargs) -> TelemetrySnapshot:
    base = dict(
        primary_o2_pct=99.0,
        secondary_o2_pct=98.0,
        battery_pct=87.0,
        co2_status="nominal",
        comms_status="nominal",
        safe_range_m=150.0,
        ltv_status="idle",
    )
    base.update(kwargs)
    return TelemetrySnapshot.model_validate(base)


def test_nominal_empty():
    assert list_warnings(_snap()) == []


def test_primary_o2_low():
    w = list_warnings(_snap(primary_o2_pct=PRIMARY_O2_CAUTION_PCT - 1))
    codes = [x.code for x in w]
    assert "PRIMARY_O2_LOW" in codes


def test_battery_low():
    w = list_warnings(_snap(battery_pct=BATTERY_CAUTION_PCT - 1))
    assert any(x.code == "BATTERY_LOW" for x in w)


def test_co2_high_string():
    w = list_warnings(_snap(co2_status="high"))
    assert any(x.code == "CO2_HIGH" for x in w)


def test_return_margin_low():
    w = list_warnings(_snap(safe_range_m=20.0))
    assert any(x.code == "RETURN_MARGIN_LOW" for x in w)


def test_comms_degraded():
    w = list_warnings(_snap(comms_status="degraded"))
    assert any(x.code == "COMMS_DEGRADED" for x in w)


def test_bundle_fan_error():
    bundle = FIXTURE_BUNDLE.model_copy(deep=True)
    bundle.errors = {"fan_error": True, "oxy_error": False, "pump_error": False}
    w = list_warnings(_snap(), bundle)
    assert any(x.code == "FAN_ERROR" for x in w)


def test_bundle_secondary_o2_low_ev2():
    w = list_warnings(_snap(), FIXTURE_BUNDLE)
    codes = [x.code for x in w]
    assert "SECONDARY_O2_LOW_EV2" in codes
    assert "HEART_RATE_HIGH_EV2" in codes
    assert "DCU_FAN_DEGRADED_EV2" in codes


def test_bundle_ltv_fault():
    bundle = FIXTURE_BUNDLE.model_copy(deep=True)
    bundle.ltv_errors = {
        "error_procedures": [
            {"code": "4155", "needs_resolved": True, "description": "LTV fault", "procedures": []}
        ]
    }
    w = list_warnings(_snap(), bundle)
    assert any(x.code == "LTV_FAULT" for x in w)

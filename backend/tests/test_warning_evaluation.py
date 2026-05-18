from app.models.telemetry import TelemetrySnapshot
from app.services.warning_evaluation import (
    BATTERY_CAUTION_PCT,
    PRIMARY_O2_CAUTION_PCT,
    list_warnings,
)


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

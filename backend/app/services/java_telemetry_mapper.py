"""Map Java backend JSON payloads to EVA TelemetrySnapshot."""

from __future__ import annotations

from typing import Any

from app.models.live_telemetry import LiveTelemetryBundle
from app.models.telemetry import TelemetrySnapshot

# Scrubber storage fill levels (0–100 scale from TSS).
_CO2_ELEVATED = 50.0
_CO2_HIGH = 80.0


def _float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp_pct(value: float) -> float:
    return max(0.0, min(100.0, value))


def _dcu_from_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
    return bundle.get("dcu1") or bundle.get("dcu") or {}


def map_co2_status(ev1: dict[str, Any], errors: dict[str, Any]) -> str:
    if errors.get("fan_error") or errors.get("oxy_error") or errors.get("pump_error"):
        return "elevated"
    scrub_a = _float(ev1.get("scrubber_a_co2_storage"))
    scrub_b = _float(ev1.get("scrubber_b_co2_storage"))
    helmet = _float(ev1.get("helmet_pressure_co2"))
    peak = max(scrub_a, scrub_b, helmet)
    if peak >= _CO2_HIGH:
        return "high"
    if peak >= _CO2_ELEVATED:
        return "elevated"
    return "nominal"


def map_comms_status(dcu: dict[str, Any], errors: dict[str, Any]) -> str:
    if errors.get("fan_error") or errors.get("oxy_error") or errors.get("pump_error"):
        return "degraded"
    comms = str(dcu.get("comms", "A")).strip().upper()
    if comms == "A":
        return "nominal"
    return "degraded"


def map_ltv_status(ltv: dict[str, Any], ltv_errors: dict[str, Any]) -> str:
    procedures = ltv_errors.get("error_procedures") or []
    if isinstance(procedures, list):
        for item in procedures:
            if isinstance(item, dict) and item.get("needs_resolved"):
                return "fault"
    signal = ltv.get("signal") if isinstance(ltv.get("signal"), dict) else {}
    if signal.get("ping_requested") or signal.get("ping_unlimited_requested"):
        return "ping_requested"
    strength = _float(signal.get("strength"), default=0.0)
    if strength < -80.0:
        return "searching"
    return "idle"


def build_snapshot(bundle: LiveTelemetryBundle | dict[str, Any]) -> TelemetrySnapshot:
    """Build TelemetrySnapshot from a live telemetry bundle."""
    if isinstance(bundle, LiveTelemetryBundle):
        data = bundle.model_dump()
    else:
        data = bundle

    ev1 = data["ev1"]
    dcu = _dcu_from_bundle(data)
    errors = data["errors"]
    rover = data["rover"]
    ltv = data["ltv"]
    ltv_errors = data["ltv_errors"]

    safe_range = _float(rover.get("pointOfNoReturn"), default=0.0)
    if safe_range <= 0.0:
        safe_range = _float(rover.get("distanceFromBase"), default=0.0)

    return TelemetrySnapshot(
        primary_o2_pct=_clamp_pct(_float(ev1.get("oxy_pri_storage"), 100.0)),
        secondary_o2_pct=_clamp_pct(_float(ev1.get("oxy_sec_storage"), 100.0)),
        battery_pct=_clamp_pct(_float(ev1.get("batt_time_left"), 100.0)),
        co2_status=map_co2_status(ev1, errors),
        comms_status=map_comms_status(dcu, errors),
        safe_range_m=max(0.0, safe_range),
        ltv_status=map_ltv_status(ltv, ltv_errors),
    )

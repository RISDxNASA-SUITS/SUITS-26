"""
Derive EVA warnings from telemetry summary and raw Java bundle. Deterministic thresholds, no ML.
"""

from __future__ import annotations

from typing import Any

from app.models.live_telemetry import LiveTelemetryBundle
from app.models.telemetry import TelemetrySnapshot
from app.models.warning import WarningItem

# Thresholds (mock mission policy)
PRIMARY_O2_CAUTION_PCT = 25.0
BATTERY_CAUTION_PCT = 25.0
SAFE_RANGE_CAUTION_M = 40.0
HEART_RATE_HIGH_BPM = 160.0
DCU_FAN_NOMINAL = "PRI"


def _float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1", "yes")
    return bool(value)


def _warnings_from_snapshot(snapshot: TelemetrySnapshot) -> list[WarningItem]:
    out: list[WarningItem] = []

    if snapshot.primary_o2_pct < PRIMARY_O2_CAUTION_PCT:
        out.append(
            WarningItem(
                code="PRIMARY_O2_LOW",
                severity="warning",
                message=f"Primary O₂ low: {snapshot.primary_o2_pct:.1f}% (threshold {PRIMARY_O2_CAUTION_PCT:g}%).",
            )
        )

    if snapshot.battery_pct < BATTERY_CAUTION_PCT:
        out.append(
            WarningItem(
                code="BATTERY_LOW",
                severity="warning",
                message=f"Battery low: {snapshot.battery_pct:.1f}% (threshold {BATTERY_CAUTION_PCT:g}%).",
            )
        )

    co2_l = snapshot.co2_status.strip().lower()
    if co2_l in ("elevated", "high", "critical") or "high" in co2_l:
        out.append(
            WarningItem(
                code="CO2_HIGH",
                severity="warning",
                message=f"CO₂ elevated: status {snapshot.co2_status}.",
            )
        )

    if snapshot.safe_range_m < SAFE_RANGE_CAUTION_M:
        out.append(
            WarningItem(
                code="RETURN_MARGIN_LOW",
                severity="caution",
                message=f"Return margin low: {snapshot.safe_range_m:.1f} m to safe reference.",
            )
        )

    comms_l = snapshot.comms_status.strip().lower()
    if comms_l not in ("nominal", "ok", "good"):
        out.append(
            WarningItem(
                code="COMMS_DEGRADED",
                severity="warning",
                message=f"Comms degraded: {snapshot.comms_status}.",
            )
        )

    return out


def _warnings_from_bundle(bundle: LiveTelemetryBundle) -> list[WarningItem]:
    out: list[WarningItem] = []
    errors = bundle.errors

    if _bool(errors.get("fan_error")):
        out.append(
            WarningItem(
                code="FAN_ERROR",
                severity="warning",
                message="Fan error reported by suit systems.",
            )
        )
    if _bool(errors.get("oxy_error")):
        out.append(
            WarningItem(
                code="OXY_ERROR",
                severity="warning",
                message="Oxygen system error reported.",
            )
        )
    if _bool(errors.get("pump_error")):
        out.append(
            WarningItem(
                code="PUMP_ERROR",
                severity="warning",
                message="Pump error reported by suit systems.",
            )
        )

    sec1 = _float(bundle.ev1.get("oxy_sec_storage"), default=100.0)
    if sec1 < PRIMARY_O2_CAUTION_PCT:
        out.append(
            WarningItem(
                code="SECONDARY_O2_LOW",
                severity="warning",
                message=f"EV1 secondary O₂ low: {sec1:.1f}% (threshold {PRIMARY_O2_CAUTION_PCT:g}%).",
            )
        )

    sec2 = _float(bundle.ev2.get("oxy_sec_storage"), default=100.0)
    if sec2 < PRIMARY_O2_CAUTION_PCT:
        out.append(
            WarningItem(
                code="SECONDARY_O2_LOW_EV2",
                severity="warning",
                message=f"EV2 secondary O₂ low: {sec2:.1f}% (threshold {PRIMARY_O2_CAUTION_PCT:g}%).",
            )
        )

    hr1 = _float(bundle.ev1.get("heart_rate"), default=0.0)
    if hr1 > HEART_RATE_HIGH_BPM:
        out.append(
            WarningItem(
                code="HEART_RATE_HIGH",
                severity="warning",
                message=f"EV1 heart rate high: {hr1:.0f} bpm (threshold {HEART_RATE_HIGH_BPM:g}).",
            )
        )

    hr2 = _float(bundle.ev2.get("heart_rate"), default=0.0)
    if hr2 > HEART_RATE_HIGH_BPM:
        out.append(
            WarningItem(
                code="HEART_RATE_HIGH_EV2",
                severity="warning",
                message=f"EV2 heart rate high: {hr2:.0f} bpm (threshold {HEART_RATE_HIGH_BPM:g}).",
            )
        )

    procedures = bundle.ltv_errors.get("error_procedures") or []
    if isinstance(procedures, list):
        for item in procedures:
            if isinstance(item, dict) and item.get("needs_resolved"):
                code = str(item.get("code", "LTV_FAULT"))
                desc = str(item.get("description", "LTV fault requires resolution."))
                out.append(
                    WarningItem(
                        code="LTV_FAULT",
                        severity="warning",
                        message=f"LTV fault {code}: {desc}",
                    )
                )
                break

    signal = bundle.ltv.get("signal") if isinstance(bundle.ltv.get("signal"), dict) else {}
    if signal.get("ping_requested") or signal.get("ping_unlimited_requested"):
        out.append(
            WarningItem(
                code="LTV_PING_REQUESTED",
                severity="caution",
                message="LTV signal ping requested.",
            )
        )

    rover_batt = _float(bundle.rover.get("batteryLevel"), default=100.0)
    if rover_batt < BATTERY_CAUTION_PCT:
        out.append(
            WarningItem(
                code="ROVER_BATTERY_LOW",
                severity="warning",
                message=f"Rover battery low: {rover_batt:.1f}% (threshold {BATTERY_CAUTION_PCT:g}%).",
            )
        )

    fan1 = str(bundle.dcu1.get("fan", DCU_FAN_NOMINAL)).strip().upper()
    if fan1 and fan1 != DCU_FAN_NOMINAL:
        out.append(
            WarningItem(
                code="DCU_FAN_DEGRADED",
                severity="warning",
                message=f"EV1 DCU fan not on primary: {fan1}.",
            )
        )

    fan2 = str(bundle.dcu2.get("fan", DCU_FAN_NOMINAL)).strip().upper()
    if fan2 and fan2 != DCU_FAN_NOMINAL:
        out.append(
            WarningItem(
                code="DCU_FAN_DEGRADED_EV2",
                severity="warning",
                message=f"EV2 DCU fan not on primary: {fan2}.",
            )
        )

    if _bool(bundle.eva_states.get("paused")):
        out.append(
            WarningItem(
                code="EVA_PAUSED",
                severity="caution",
                message="EVA mission state is paused.",
            )
        )

    return out


def list_warnings(
    snapshot: TelemetrySnapshot,
    bundle: LiveTelemetryBundle | None = None,
) -> list[WarningItem]:
    """Merge summary-based and bundle-based warnings; dedupe by code."""
    seen: set[str] = set()
    merged: list[WarningItem] = []
    for item in _warnings_from_snapshot(snapshot) + (
        _warnings_from_bundle(bundle) if bundle is not None else []
    ):
        if item.code in seen:
            continue
        seen.add(item.code)
        merged.append(item)
    return merged

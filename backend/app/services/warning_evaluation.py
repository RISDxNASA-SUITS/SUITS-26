"""
Derive EVA warnings from telemetry snapshots. Deterministic thresholds, no ML.
"""

from app.models.telemetry import TelemetrySnapshot
from app.models.warning import WarningItem

# Thresholds (mock mission policy)
PRIMARY_O2_CAUTION_PCT = 25.0
BATTERY_CAUTION_PCT = 25.0
SAFE_RANGE_CAUTION_M = 40.0


def list_warnings(snapshot: TelemetrySnapshot) -> list[WarningItem]:
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

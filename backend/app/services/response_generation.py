"""
Centralized user-facing response lines — concise, safety-oriented, no chat.
"""

from app.models.telemetry import TelemetrySnapshot
from app.services.diagnosis_service import diagnosis_line
from app.services.warning_evaluation import list_warnings


def status_oxygen(snapshot: TelemetrySnapshot) -> str:
    warnings = list_warnings(snapshot)
    base = f"O₂ primary {snapshot.primary_o2_pct:.1f}%, secondary {snapshot.secondary_o2_pct:.1f}%."
    for w in warnings:
        if w.code == "PRIMARY_O2_LOW":
            return f"{base} {w.message}"
    return base


def status_battery(snapshot: TelemetrySnapshot) -> str:
    warnings = list_warnings(snapshot)
    base = f"Battery {snapshot.battery_pct:.1f}% SOC."
    for w in warnings:
        if w.code == "BATTERY_LOW":
            return f"{base} {w.message}"
    return base


def status_co2(snapshot: TelemetrySnapshot) -> str:
    warnings = list_warnings(snapshot)
    base = f"CO₂ status: {snapshot.co2_status}."
    for w in warnings:
        if w.code == "CO2_HIGH":
            return f"{base} {w.message}"
    return base


def warning_check_summary(snapshot: TelemetrySnapshot) -> str:
    warnings = list_warnings(snapshot)
    if not warnings:
        return "No active warnings from current telemetry rules."
    parts = [f"{len(warnings)} warning(s):"]
    parts.extend(w.message for w in warnings)
    return " ".join(parts)


def diagnosis_stub(ltv_status: str) -> str:
    return diagnosis_line(ltv_status)

"""
Default mission and telemetry snapshots.

- **Demo** (`EVA_DEMO_MODE=true`, default): mid-EVA style phase and realistic mock readouts.
- **Training** (used by tests via `seed_training()`): deterministic INIT-era values.
"""

from app.models.mission import MissionPhase
from app.models.telemetry import TelemetrySnapshot

# Test / non-demo baseline — matches historical test expectations (e.g. 99.0% O₂).
TRAINING_TELEMETRY = TelemetrySnapshot(
    primary_o2_pct=99.0,
    secondary_o2_pct=98.5,
    battery_pct=87.0,
    co2_status="nominal",
    comms_status="nominal",
    safe_range_m=150.0,
    ltv_status="idle",
)

# Demo walkthrough: egress-capable phase, plausible suit / vehicle mock.
DEMO_TELEMETRY = TelemetrySnapshot(
    primary_o2_pct=96.2,
    secondary_o2_pct=94.8,
    battery_pct=82.0,
    co2_status="nominal",
    comms_status="nominal",
    safe_range_m=142.0,
    ltv_status="idle",
)


def initial_mission_phase_for_app() -> MissionPhase:
    from app.core.config import settings

    return MissionPhase.EGRESS if settings.demo_mode else MissionPhase.INIT


def initial_telemetry_snapshot() -> TelemetrySnapshot:
    from app.core.config import settings

    base = DEMO_TELEMETRY if settings.demo_mode else TRAINING_TELEMETRY
    return base.model_copy(deep=True)

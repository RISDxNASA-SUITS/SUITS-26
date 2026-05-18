from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.live_telemetry import LiveTelemetryBundle
from app.models.telemetry import TelemetrySnapshot, TelemetryUpdate
from app.models.warning import WarningItem
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service
from app.services.warning_evaluation import list_warnings

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


def _require_live_telemetry_available() -> None:
    if settings.live_telemetry_enabled and not live_telemetry_state.is_ok():
        raise HTTPException(
            status_code=503,
            detail="Live telemetry unavailable: Java backend unreachable or not yet polled.",
        )


@router.get("", response_model=TelemetrySnapshot)
def get_telemetry() -> TelemetrySnapshot:
    _require_live_telemetry_available()
    return telemetry_service.get_snapshot()


@router.get("/full", response_model=LiveTelemetryBundle)
def get_telemetry_full() -> LiveTelemetryBundle:
    """Full raw Java mission telemetry bundle from last successful poll."""
    _require_live_telemetry_available()
    bundle = telemetry_service.get_bundle()
    if bundle is None:
        raise HTTPException(status_code=503, detail="Telemetry bundle not available.")
    return bundle


@router.get("/warnings", response_model=list[WarningItem])
def get_telemetry_warnings() -> list[WarningItem]:
    """Derived caution/warning list from summary and raw Java bundle."""
    _require_live_telemetry_available()
    return list_warnings(telemetry_service.get_snapshot(), telemetry_service.get_bundle())


@router.post("/update", response_model=TelemetrySnapshot)
def post_telemetry_update(body: TelemetryUpdate) -> TelemetrySnapshot:
    if settings.live_telemetry_enabled:
        raise HTTPException(
            status_code=409,
            detail="Manual telemetry updates are disabled while live telemetry is enabled.",
        )
    return telemetry_service.update(body)

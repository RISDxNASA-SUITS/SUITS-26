from fastapi import APIRouter

from app.models.telemetry import TelemetrySnapshot, TelemetryUpdate
from app.models.warning import WarningItem
from app.services.telemetry_service import telemetry_service
from app.services.warning_evaluation import list_warnings

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.get("", response_model=TelemetrySnapshot)
def get_telemetry() -> TelemetrySnapshot:
    return telemetry_service.get_snapshot()


@router.get("/warnings", response_model=list[WarningItem])
def get_telemetry_warnings() -> list[WarningItem]:
    """Derived caution/warning list from current mock telemetry."""
    return list_warnings(telemetry_service.get_snapshot())


@router.post("/update", response_model=TelemetrySnapshot)
def post_telemetry_update(body: TelemetryUpdate) -> TelemetrySnapshot:
    return telemetry_service.update(body)

from fastapi import APIRouter

from app.core.config import settings
from app.models.agent import AgentAlertItem, AgentStatusResponse
from app.services.alert_service import list_agent_alerts

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/status", response_model=AgentStatusResponse)
def get_agent_status() -> AgentStatusResponse:
    return AgentStatusResponse(
        agentic_enabled=settings.agentic_enabled,
        telemetry_json_poll=bool(settings.telemetry_json_path and str(settings.telemetry_json_path).strip()),
    )


@router.get("/alerts", response_model=list[AgentAlertItem])
def get_agent_alerts() -> list[AgentAlertItem]:
    return list_agent_alerts()

from fastapi import APIRouter

from app.core.config import settings
from app.models.agent import AgentAlertItem, AgentStatusResponse
from app.models.system_event import SystemEventItem
from app.services.alert_service import list_agent_alerts
from app.services.event_log_service import list_events
from app.services.live_telemetry_state import live_telemetry_state

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/status", response_model=AgentStatusResponse)
def get_agent_status() -> AgentStatusResponse:
    java_ok = live_telemetry_state.is_ok() if settings.live_telemetry_enabled else True
    return AgentStatusResponse(
        agentic_enabled=settings.agentic_enabled,
        live_telemetry_enabled=settings.live_telemetry_enabled,
        java_backend_reachable=java_ok,
    )


@router.get("/alerts", response_model=list[AgentAlertItem])
def get_agent_alerts() -> list[AgentAlertItem]:
    return list_agent_alerts()


@router.get("/events", response_model=list[SystemEventItem])
def get_system_events() -> list[SystemEventItem]:
    return list_events()

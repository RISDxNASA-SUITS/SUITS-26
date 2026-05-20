import os

# Tests use in-memory mock telemetry, not the Java poller.
os.environ["EVA_LIVE_TELEMETRY"] = "false"

import pytest

from app.core.config import settings
from app.models.mission import MissionPhase
from app.services.alert_service import reset_agent_alerts_for_tests
from app.services.event_log_service import reset_events_for_tests
from app.services.warning_edge_service import reset_warning_edge_for_tests
from app.services.live_telemetry_state import live_telemetry_state
from app.services.mission_service import mission_service
from app.services.procedure_service import procedure_service
from app.services.telemetry_service import telemetry_service


@pytest.fixture(autouse=True)
def reset_singleton_state():
    """Avoid cross-test leakage for shared in-memory services."""
    settings.live_telemetry_enabled = False
    settings.agentic_enabled = False
    live_telemetry_state.set_ok(True)
    mission_service.set_phase(MissionPhase.INIT)
    telemetry_service.seed_training()
    procedure_service.reset_idle()
    reset_agent_alerts_for_tests()
    reset_events_for_tests()
    reset_warning_edge_for_tests()
    yield

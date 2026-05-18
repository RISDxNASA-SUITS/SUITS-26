from unittest.mock import patch

from app.models.telemetry import TelemetryUpdate
from app.services import alert_service, event_log_service
from app.services.llm_client import LlmOutcome
from app.services.telemetry_service import telemetry_service


def test_alert_tick_logs_alert_and_error_on_llm_fail():
    event_log_service.reset_events_for_tests()
    alert_service.reset_agent_alerts_for_tests()
    telemetry_service.seed_training()
    telemetry_service.update(TelemetryUpdate(primary_o2_pct=10.0))
    with patch(
        "app.services.alert_service.llm_client.chat_completion",
        return_value=LlmOutcome(text="x", error_code="LLM_UNAVAILABLE"),
    ):
        alert_service._tick()
    events = event_log_service.list_events()
    levels = {e.level for e in events}
    assert "alert" in levels
    assert "error" in levels

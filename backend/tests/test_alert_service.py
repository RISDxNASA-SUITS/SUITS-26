from unittest.mock import patch

from app.models.telemetry import TelemetryUpdate
from app.services import alert_service
from app.services.telemetry_service import telemetry_service


def test_alert_tick_triggers_on_new_code():
    from app.services.llm_client import LlmOutcome

    telemetry_service.seed_training()
    telemetry_service.update(TelemetryUpdate(primary_o2_pct=10.0))
    with patch(
        "app.services.alert_service.llm_client.chat_completion",
        return_value=LlmOutcome(text="Primary oxygen is critically low."),
    ):
        alert_service._tick()
    items = alert_service.list_agent_alerts()
    assert len(items) == 1
    assert "PRIMARY_O2_LOW" in items[0].codes
    assert "oxygen" in items[0].spoken_text.lower()

    with patch(
        "app.services.alert_service.llm_client.chat_completion",
        return_value=LlmOutcome(text="should not run"),
    ):
        alert_service._tick()
    assert len(alert_service.list_agent_alerts()) == 1


def test_alert_fallback_when_llm_fails():
    from app.services.llm_client import LlmOutcome

    telemetry_service.seed_training()
    telemetry_service.update(TelemetryUpdate(battery_pct=10.0))
    with patch(
        "app.services.alert_service.llm_client.chat_completion",
        return_value=LlmOutcome(text="x", error_code="LLM_UNAVAILABLE"),
    ):
        alert_service._tick()
    items = alert_service.list_agent_alerts()
    assert len(items) == 1
    assert "BATTERY_LOW" in items[0].codes
    assert "Battery" in items[0].spoken_text or "battery" in items[0].spoken_text.lower()

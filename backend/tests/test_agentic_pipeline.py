from unittest.mock import patch

from app.services.agentic_pipeline import run_agentic_pipeline
from app.services.telemetry_service import telemetry_service


def test_agentic_navigate_branch():
    calls = []

    def fake_chat(messages):
        calls.append(messages)
        from app.services.llm_client import LlmOutcome

        if len(calls) == 1:
            return LlmOutcome(text='{"action":"navigate","location":"hab","reason":null}')
        return LlmOutcome(text="unexpected")

    with patch("app.services.agentic_pipeline.llm_client.chat_completion", side_effect=fake_chat):
        r = run_agentic_pipeline("take me to the hab")
    assert r.success
    assert r.parsed_intent == "agent_navigate"
    assert r.entity == "hab"
    assert "hab" in r.response_text.lower()


def test_agentic_telemetry_branch():
    calls = []

    def fake_chat(messages):
        from app.services.llm_client import LlmOutcome

        calls.append(messages)
        if len(calls) == 1:
            return LlmOutcome(text='{"action":"telemetry","location":null}')
        return LlmOutcome(text="Oxygen is fine.")

    telemetry_service.seed_training()
    with patch("app.services.agentic_pipeline.llm_client.chat_completion", side_effect=fake_chat):
        r = run_agentic_pipeline("how is my oxygen")
    assert r.success
    assert r.parsed_intent == "agent_telemetry"
    assert r.response_text == "Oxygen is fine."


def test_agentic_router_llm_error():
    from app.services.llm_client import LlmOutcome

    with patch(
        "app.services.agentic_pipeline.llm_client.chat_completion",
        return_value=LlmOutcome(text="down", error_code="LLM_UNAVAILABLE"),
    ):
        r = run_agentic_pipeline("anything")
    assert not r.success
    assert r.error_code == "LLM_UNAVAILABLE"


def test_agentic_telemetry_unavailable():
    from app.services.llm_client import LlmOutcome

    telemetry_service.set_available(False)
    with patch(
        "app.services.agentic_pipeline.llm_client.chat_completion",
        return_value=LlmOutcome(text='{"action":"telemetry","location":null}'),
    ):
        r = run_agentic_pipeline("battery level")
    assert not r.success
    assert r.error_code == "TELEMETRY_UNAVAILABLE"
    telemetry_service.set_available(True)

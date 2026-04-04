"""Safety / guardrails for POST /command."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.mission import MissionPhase
from app.services.mission_service import mission_service
from app.services.telemetry_service import telemetry_service

client = TestClient(app)


def test_telemetry_unavailable_blocks_status():
    telemetry_service.set_available(False)
    try:
        r = client.post("/command", json={"text": "oxygen status"})
        body = r.json()
        assert body["success"] is False
        assert body["error_code"] == "TELEMETRY_UNAVAILABLE"
        assert "oxygen" in body["response_text"].lower()
        assert "unavailable" in body["response_text"].lower()
    finally:
        telemetry_service.set_available(True)


def test_telemetry_unavailable_blocks_warnings():
    telemetry_service.set_available(False)
    try:
        r = client.post("/command", json={"text": "any warnings"})
        body = r.json()
        assert body["success"] is False
        assert body["error_code"] == "TELEMETRY_UNAVAILABLE"
        assert "warnings" in body["response_text"].lower()
    finally:
        telemetry_service.set_available(True)


def test_diagnosis_denied_outside_ltv_repair():
    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/command", json={"text": "run diagnosis"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "DIAGNOSIS_PHASE_DENIED"


def test_diagnosis_allowed_in_ltv_repair():
    mission_service.set_phase(MissionPhase.LTV_REPAIR)
    r = client.post("/command", json={"text": "run diagnosis"})
    body = r.json()
    assert body["success"] is True
    assert "Diagnosis" in body["response_text"]


def test_navigation_denied_in_init():
    mission_service.set_phase(MissionPhase.INIT)
    r = client.post("/command", json={"text": "guide me back"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "NAVIGATION_PHASE_DENIED"


def test_navigation_allowed_in_eva_nav():
    mission_service.set_phase(MissionPhase.EVA_NAV)
    r = client.post("/command", json={"text": "return route"})
    body = r.json()
    assert body["success"] is True
    assert "Return:" in body["response_text"] or "airlock" in body["response_text"].lower()


def test_next_step_no_active_procedure():
    r = client.post("/command", json={"text": "next step"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "NO_ACTIVE_PROCEDURE"
    assert "Unable to advance" in body["response_text"]


def test_repeat_step_no_active_procedure():
    r = client.post("/command", json={"text": "repeat step"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "NO_ACTIVE_PROCEDURE"


def test_procedure_complete_phase_blocks_start():
    mission_service.set_phase(MissionPhase.COMPLETE)
    r = client.post("/command", json={"text": "start egress"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "COMMAND_PHASE_DENIED"


def test_erm_not_allowed_in_egress_phase_message():
    """Example-style copy: procedure vs current phase."""
    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/command", json={"text": "start repair"})
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "PROCEDURE_NOT_ALLOWED_IN_PHASE"
    assert "ERM_REPAIR" in body["response_text"]
    assert "EGRESS" in body["response_text"]
    assert "LTV_REPAIR" in body["response_text"]


def test_next_allowed_after_start():
    mission_service.set_phase(MissionPhase.EGRESS)
    c1 = client.post("/command", json={"text": "start egress"})
    assert c1.json()["success"] is True
    c2 = client.post("/command", json={"text": "next step"})
    assert c2.json()["success"] is True
    assert "Advanced" in c2.json()["response_text"] or "complete" in c2.json()["response_text"].lower()

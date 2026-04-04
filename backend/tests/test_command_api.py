from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_post_command_help():
    r = client.post("/command", json={"text": "help"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["error_code"] is None
    assert body["input_text"] == "help"
    assert body["parsed_intent"] == "help"
    assert body["entity"] is None
    assert "oxygen" in body["response_text"].lower() or "status" in body["response_text"].lower()


def test_post_command_oxygen_status_query():
    r = client.post("/command", json={"text": "oxygen status"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "status_query"
    assert body["entity"] == "oxygen"
    assert "O₂ primary" in body["response_text"] or "primary" in body["response_text"].lower()
    assert "99.0" in body["response_text"]


def test_post_command_what_is_my_oxygen():
    r = client.post("/command", json={"text": "what is my oxygen"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "status_query"
    assert body["entity"] == "oxygen"


def test_post_command_battery():
    r = client.post("/command", json={"text": "battery status"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "status_query"
    assert body["entity"] == "battery"
    assert "87.0" in body["response_text"]


def test_post_command_any_warnings_nominal():
    r = client.post("/command", json={"text": "any warnings"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "warning_check"
    assert "No active warnings" in body["response_text"] or "warning" in body["response_text"].lower()


def test_post_command_co2():
    r = client.post("/command", json={"text": "co2 status"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "status_query"
    assert body["entity"] == "co2"
    assert "nominal" in body["response_text"].lower()


def test_post_command_phase_check():
    r = client.post("/command", json={"text": "what phase am i in"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "mission_phase_check"
    assert body["entity"] is None
    assert "INIT" in body["response_text"]
    assert "Phase:" in body["response_text"]


def test_post_command_procedure_start_parse_only():
    from app.models.mission import MissionPhase
    from app.services.mission_service import mission_service

    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/command", json={"text": "start egress procedure"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["parsed_intent"] == "procedure_start"
    assert body["entity"] == "egress"


def test_post_command_start_egress_wrong_phase():
    """EGRESS_UIA requires EGRESS phase — INIT is rejected by guardrails."""
    r = client.post("/command", json={"text": "start egress"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "PROCEDURE_NOT_ALLOWED_IN_PHASE"
    assert body["parsed_intent"] == "procedure_start"
    assert "EGRESS_UIA" in body["response_text"]
    assert "INIT" in body["response_text"]
    assert "EGRESS" in body["response_text"]


def test_post_command_start_egress_ok_when_phase_matches():
    from app.models.mission import MissionPhase
    from app.services.mission_service import mission_service

    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/command", json={"text": "start egress"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["error_code"] is None
    assert "Started" in body["response_text"]


def test_post_command_unknown():
    r = client.post("/command", json={"text": "open the pod bay doors"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "UNKNOWN_COMMAND"
    assert body["parsed_intent"] == "unknown"
    assert body["entity"] is None
    assert "not recognized" in body["response_text"].lower()

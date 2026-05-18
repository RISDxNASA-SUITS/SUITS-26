"""HTTP endpoints for procedures."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.mission import MissionPhase
from app.services.mission_service import mission_service

client = TestClient(app)


def test_get_procedure_list():
    r = client.get("/procedure/list")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    ids = {x["procedure_id"] for x in data}
    assert ids == {"EGRESS_UIA", "ERM_REPAIR", "INGRESS_RETURN"}


def test_get_procedure_current_idle():
    r = client.get("/procedure/current")
    assert r.status_code == 200
    assert r.json()["active"] is False


def test_start_400_wrong_phase():
    mission_service.set_phase(MissionPhase.INIT)
    r = client.post("/procedure/start", json={"procedure_id": "EGRESS_UIA"})
    assert r.status_code == 400


def test_start_404_unknown():
    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/procedure/start", json={"procedure_id": "NOPE"})
    assert r.status_code == 404


def test_start_next_repeat_happy_path():
    mission_service.set_phase(MissionPhase.EGRESS)
    r = client.post("/procedure/start", json={"procedure_id": "EGRESS_UIA"})
    assert r.status_code == 200
    body = r.json()
    assert "message" in body
    assert body["state"]["active"] is True

    r2 = client.post("/procedure/next")
    assert r2.status_code == 200
    assert r2.json()["state"]["step_index"] == 1

    r3 = client.post("/procedure/repeat")
    assert r3.status_code == 200
    assert r3.json()["state"]["step_index"] == 1


def test_next_400_when_idle():
    r = client.post("/procedure/next")
    assert r.status_code == 400

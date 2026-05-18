from fastapi.testclient import TestClient

from app.main import app
from app.models.mission import MissionPhase
from app.services.mission_service import mission_service

client = TestClient(app)


def test_get_mission():
    mission_service.set_phase(MissionPhase.EVA_NAV)
    r = client.get("/mission")
    assert r.status_code == 200
    assert r.json() == {"phase": "EVA_NAV"}


def test_post_mission_phase():
    r = client.post("/mission/phase", json={"phase": "EGRESS"})
    assert r.status_code == 200
    assert r.json() == {"phase": "EGRESS"}
    assert mission_service.get_phase() == MissionPhase.EGRESS

from fastapi.testclient import TestClient

from app.main import app
from app.services.telemetry_service import telemetry_service

client = TestClient(app)


def test_get_warnings_returns_list():
    telemetry_service.seed_training()
    r = client.get("/telemetry/warnings")
    assert r.status_code == 200
    assert r.json() == []

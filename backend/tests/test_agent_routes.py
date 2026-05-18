from fastapi.testclient import TestClient

from app.main import app


def test_agent_status_and_alerts():
    client = TestClient(app)
    r = client.get("/agent/status")
    assert r.status_code == 200
    data = r.json()
    assert "agentic_enabled" in data
    assert "live_telemetry_enabled" in data
    assert "java_backend_reachable" in data
    r2 = client.get("/agent/alerts")
    assert r2.status_code == 200
    assert r2.json() == []
    r3 = client.get("/agent/events")
    assert r3.status_code == 200
    assert r3.json() == []

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.live_telemetry_state import live_telemetry_state


def test_telemetry_503_when_live_enabled_and_java_unreachable(monkeypatch):
    monkeypatch.setattr(settings, "live_telemetry_enabled", True)
    live_telemetry_state.set_ok(False)
    client = TestClient(app)
    r = client.get("/telemetry")
    assert r.status_code == 503
    r2 = client.get("/telemetry/warnings")
    assert r2.status_code == 503
    r3 = client.get("/telemetry/full")
    assert r3.status_code == 503


def test_telemetry_update_409_when_live_enabled(monkeypatch):
    monkeypatch.setattr(settings, "live_telemetry_enabled", True)
    live_telemetry_state.set_ok(True)
    client = TestClient(app)
    r = client.post("/telemetry/update", json={"battery_pct": 50.0})
    assert r.status_code == 409


def test_telemetry_ok_when_live_disabled(monkeypatch):
    monkeypatch.setattr(settings, "live_telemetry_enabled", False)
    live_telemetry_state.set_ok(False)
    client = TestClient(app)
    r = client.get("/telemetry")
    assert r.status_code == 200
    assert "primary_o2_pct" in r.json()

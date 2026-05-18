"""Tests for full Java telemetry bundle loading and API."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.telemetry_fixtures import demo_bundle, training_bundle
from app.main import app
from app.services.java_telemetry_client import fetch_live_telemetry_bundle
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service
from tests.fixtures.live_telemetry_bundle import FIXTURE_BUNDLE


def test_training_bundle_loads():
    b = training_bundle()
    assert b.ev1["oxy_pri_storage"] == 99.0
    assert b.polled_at_unix > 0


def test_demo_bundle_loads():
    b = demo_bundle()
    assert b.ev1["oxy_pri_storage"] == 96.2


def test_fetch_live_telemetry_bundle_aggregates_endpoints():
    client = MagicMock()
    client.timeout_s = 2.0
    client.fetch_ev1_telemetry = MagicMock(return_value={"a": 1})
    client.fetch_ev2_telemetry = MagicMock(return_value={"b": 2})
    client.fetch_dcu1 = MagicMock(return_value={})
    client.fetch_dcu2 = MagicMock(return_value={})
    client.fetch_errors = MagicMock(return_value={})
    client.fetch_imu1 = MagicMock(return_value={})
    client.fetch_imu2 = MagicMock(return_value={})
    client.fetch_uia = MagicMock(return_value={})
    client.fetch_eva_states = MagicMock(return_value={})
    client.fetch_rover_telemetry = MagicMock(return_value={})
    client.fetch_lidar = MagicMock(return_value={"data": []})
    client.fetch_ltv = MagicMock(return_value={})
    client.fetch_ltv_errors = MagicMock(return_value={})

    with patch("app.services.java_telemetry_client.httpx.Client") as mock_client_cls:
        mock_client_cls.return_value.__enter__.return_value = MagicMock()
        bundle = fetch_live_telemetry_bundle(client)

    assert bundle.ev1 == {"a": 1}
    assert bundle.ev2 == {"b": 2}
    assert bundle.lidar == {"data": []}


def test_get_telemetry_full(monkeypatch):
    monkeypatch.setattr(settings, "live_telemetry_enabled", False)
    telemetry_service.replace_bundle(FIXTURE_BUNDLE.model_copy(deep=True))
    live_telemetry_state.set_ok(True)
    client = TestClient(app)
    r = client.get("/telemetry/full")
    assert r.status_code == 200
    body = r.json()
    assert body["ev1"]["oxy_pri_storage"] == 88.5
    assert body["ev2"]["oxy_sec_storage"] == 20.0
    assert "imu1" in body
    assert "lidar" in body


def test_get_telemetry_full_503_when_live_unreachable(monkeypatch):
    monkeypatch.setattr(settings, "live_telemetry_enabled", True)
    live_telemetry_state.set_ok(False)
    client = TestClient(app)
    r = client.get("/telemetry/full")
    assert r.status_code == 503

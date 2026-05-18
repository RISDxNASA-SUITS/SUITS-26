from unittest.mock import MagicMock

import pytest

from app.services.java_telemetry_client import JavaTelemetryError
from app.services.java_telemetry_poller import poll_java_telemetry_once
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service
from tests.fixtures.live_telemetry_bundle import FIXTURE_BUNDLE


def test_poll_java_telemetry_once_success(monkeypatch):
    monkeypatch.setattr(
        "app.services.java_telemetry_poller.fetch_live_telemetry_bundle",
        lambda client=None: FIXTURE_BUNDLE.model_copy(deep=True),
    )
    telemetry_service.seed_training()
    live_telemetry_state.set_ok(False)

    poll_java_telemetry_once()

    assert live_telemetry_state.is_ok()
    snap = telemetry_service.get_snapshot()
    assert snap.primary_o2_pct == 88.5
    assert snap.battery_pct == 76.0
    bundle = telemetry_service.get_bundle()
    assert bundle is not None
    assert bundle.ev1["oxy_pri_storage"] == 88.5
    assert bundle.ev2["oxy_sec_storage"] == 20.0


def test_poll_java_telemetry_once_failure_sets_not_ok(monkeypatch):
    def _fail(_client=None):
        raise JavaTelemetryError("connection refused")

    monkeypatch.setattr("app.services.java_telemetry_poller.fetch_live_telemetry_bundle", _fail)
    telemetry_service.seed_training()
    live_telemetry_state.set_ok(True)

    poll_java_telemetry_once()

    assert not live_telemetry_state.is_ok()
    assert telemetry_service.get_snapshot().primary_o2_pct == 99.0

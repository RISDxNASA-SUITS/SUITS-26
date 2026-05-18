"""Load training/demo live telemetry bundles from JSON fixtures."""

from __future__ import annotations

import json
import time
from pathlib import Path

from app.models.live_telemetry import LiveTelemetryBundle

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "telemetry"


def _load_fixture(name: str) -> LiveTelemetryBundle:
    path = _DATA_DIR / name
    raw = json.loads(path.read_text(encoding="utf-8"))
    raw["polled_at_unix"] = time.time()
    return LiveTelemetryBundle.model_validate(raw)


def training_bundle() -> LiveTelemetryBundle:
    return _load_fixture("training_bundle.json")


def demo_bundle() -> LiveTelemetryBundle:
    return _load_fixture("demo_bundle.json")


def initial_bundle() -> LiveTelemetryBundle:
    from app.core.config import settings

    return demo_bundle() if settings.demo_mode else training_bundle()

"""Background poll of a JSON file into telemetry_service (connection-server simulation)."""

from __future__ import annotations

import json
import logging
import threading
import time
from pathlib import Path

from app.core.config import settings
from app.models.telemetry import TelemetrySnapshot
from app.services.telemetry_service import telemetry_service

logger = logging.getLogger(__name__)


def _read_and_apply(path: Path) -> None:
    if not path.is_file():
        return
    try:
        text = path.read_text(encoding="utf-8")
        data = json.loads(text)
        snap = TelemetrySnapshot.model_validate(data)
        telemetry_service.replace_snapshot(snap)
    except (OSError, json.JSONDecodeError, ValueError) as e:
        logger.warning("Telemetry JSON poll skipped: %s", e)


def run_telemetry_json_poller(stop: threading.Event, path_str: str, interval_s: float) -> None:
    path = Path(path_str).expanduser()
    _read_and_apply(path)
    while True:
        if stop.wait(timeout=max(0.1, interval_s)):
            break
        _read_and_apply(path)


def start_telemetry_json_poller_thread(stop: threading.Event) -> threading.Thread | None:
    p = settings.telemetry_json_path
    if not p or not str(p).strip():
        return None
    interval = settings.telemetry_json_poll_interval_s
    t = threading.Thread(
        target=run_telemetry_json_poller,
        args=(stop, str(p).strip(), interval),
        name="telemetry-json-poller",
        daemon=True,
    )
    t.start()
    return t

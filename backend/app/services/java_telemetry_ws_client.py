"""WebSocket client for full mission telemetry from the Java hub."""

from __future__ import annotations

import asyncio
import json
import logging
import threading
import time
from typing import Any
from urllib.parse import urlparse, urlunparse

import websockets
from websockets.exceptions import WebSocketException

from app.core.config import settings
from app.models.live_telemetry import LiveTelemetryBundle
from app.services import event_log_service
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service

logger = logging.getLogger(__name__)

INITIAL_BACKOFF_S = 1.0
MAX_BACKOFF_S = 30.0
_ws_error_logged = False


def java_mission_ws_url() -> str:
    if settings.java_backend_ws_url:
        return settings.java_backend_ws_url.rstrip("/") + (
            "" if "/telemetry/mission/live" in settings.java_backend_ws_url else "/telemetry/mission/live"
        )
    parsed = urlparse(settings.java_backend_url)
    scheme = "wss" if parsed.scheme == "https" else "ws"
    netloc = parsed.netloc or parsed.path
    return urlunparse((scheme, netloc, "/telemetry/mission/live", "", "", ""))


def parse_mission_payload(raw: str) -> LiveTelemetryBundle:
    data: dict[str, Any] = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("mission WebSocket payload must be a JSON object")
    polled = data.get("polled_at_unix")
    if polled is None:
        polled = time.time()
    bundle_fields = {
        "ev1": data.get("ev1") or {},
        "ev2": data.get("ev2") or {},
        "dcu1": data.get("dcu1") or {},
        "dcu2": data.get("dcu2") or {},
        "errors": data.get("errors") or {},
        "imu1": data.get("imu1") or {},
        "imu2": data.get("imu2") or {},
        "uia": data.get("uia") or {},
        "eva_states": data.get("eva_states") or {},
        "rover": data.get("rover") or {},
        "lidar": data.get("lidar") or {},
        "ltv": data.get("ltv") or {},
        "ltv_errors": data.get("ltv_errors") or {},
        "polled_at_unix": float(polled),
    }
    hub_error = data.get("hub_error")
    if hub_error:
        logger.debug("Java mission hub_error: %s", hub_error)
    return LiveTelemetryBundle.model_validate(bundle_fields)


def apply_mission_bundle(bundle: LiveTelemetryBundle) -> None:
    global _ws_error_logged
    telemetry_service.replace_bundle(bundle)
    live_telemetry_state.set_ok(True)
    _ws_error_logged = False


def _mark_ws_failure(exc: Exception) -> None:
    global _ws_error_logged
    live_telemetry_state.set_ok(False)
    logger.warning("Java mission WebSocket failed: %s", exc)
    if not _ws_error_logged:
        event_log_service.append_event(
            "error",
            f"Java mission WebSocket failed: {exc}",
            source="java_ws",
        )
        _ws_error_logged = True


async def _listen_loop(stop: threading.Event, ws_url: str) -> None:
    backoff = INITIAL_BACKOFF_S
    while not stop.is_set():
        try:
            async with websockets.connect(ws_url, open_timeout=5) as ws:
                backoff = INITIAL_BACKOFF_S
                async for message in ws:
                    if stop.is_set():
                        break
                    try:
                        bundle = parse_mission_payload(message)
                        apply_mission_bundle(bundle)
                    except (ValueError, json.JSONDecodeError) as exc:
                        logger.warning("Invalid mission WebSocket message: %s", exc)
        except (WebSocketException, OSError, asyncio.TimeoutError) as exc:
            if stop.is_set():
                break
            _mark_ws_failure(exc)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, MAX_BACKOFF_S)


def _run_ws_loop(stop: threading.Event, ws_url: str) -> None:
    try:
        asyncio.run(_listen_loop(stop, ws_url))
    except Exception as exc:
        logger.exception("Java mission WebSocket thread exited: %s", exc)
        _mark_ws_failure(exc)


def start_java_telemetry_ws_thread(stop: threading.Event) -> threading.Thread | None:
    if not settings.live_telemetry_enabled:
        return None
    ws_url = java_mission_ws_url()
    t = threading.Thread(
        target=_run_ws_loop,
        args=(stop, ws_url),
        name="java-telemetry-ws",
        daemon=True,
    )
    t.start()
    return t

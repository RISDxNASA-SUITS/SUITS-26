"""Background poll of the Java backend into telemetry_service."""

from __future__ import annotations

import logging
import threading

from app.core.config import settings
from app.services import event_log_service
from app.services.java_telemetry_client import (
    JavaTelemetryClient,
    JavaTelemetryError,
    fetch_live_telemetry_bundle,
)
from app.services.live_telemetry_state import live_telemetry_state
from app.services.telemetry_service import telemetry_service

logger = logging.getLogger(__name__)

_java_error_logged = False


def poll_java_telemetry_once(client: JavaTelemetryClient | None = None) -> None:
    """Fetch from Java, update bundle + snapshot, and set live_telemetry_state."""
    global _java_error_logged
    try:
        bundle = fetch_live_telemetry_bundle(client)
        telemetry_service.replace_bundle(bundle)
        live_telemetry_state.set_ok(True)
        _java_error_logged = False
    except JavaTelemetryError as exc:
        live_telemetry_state.set_ok(False)
        logger.warning("Java telemetry poll failed: %s", exc)
        if not _java_error_logged:
            event_log_service.append_event(
                "error",
                f"Java telemetry poll failed: {exc}",
                source="java_poller",
            )
            _java_error_logged = True


def run_java_telemetry_poller(
    stop: threading.Event,
    interval_s: float,
    client: JavaTelemetryClient | None = None,
) -> None:
    poll_java_telemetry_once(client)
    while True:
        if stop.wait(timeout=max(0.1, interval_s)):
            break
        poll_java_telemetry_once(client)


def start_java_telemetry_poller_thread(stop: threading.Event) -> threading.Thread | None:
    if not settings.live_telemetry_enabled:
        return None
    interval = settings.live_telemetry_poll_interval_s
    t = threading.Thread(
        target=run_java_telemetry_poller,
        args=(stop, interval),
        name="java-telemetry-poller",
        daemon=True,
    )
    t.start()
    return t


def start_java_telemetry_listener_thread(stop: threading.Event) -> threading.Thread | None:
    """Start WebSocket or HTTP listener based on EVA_JAVA_TELEMETRY_TRANSPORT."""
    if not settings.live_telemetry_enabled:
        return None
    transport = (settings.java_telemetry_transport or "websocket").strip().lower()
    if transport == "http":
        return start_java_telemetry_poller_thread(stop)
    from app.services.java_telemetry_ws_client import start_java_telemetry_ws_thread

    return start_java_telemetry_ws_thread(stop)

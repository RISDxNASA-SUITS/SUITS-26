"""Background monitor: newly active warning codes → warning-level system events."""

from __future__ import annotations

import logging
import threading

from app.core.config import settings
from app.services import event_log_service
from app.services.telemetry_service import telemetry_service
from app.services.warning_evaluation import list_warnings

logger = logging.getLogger(__name__)

_prev_codes: frozenset[str] = frozenset()


def process_new_warnings() -> None:
    """Log warning events for newly gained codes."""
    global _prev_codes
    snap = telemetry_service.get_snapshot()
    warnings = list_warnings(snap)
    codes = frozenset(w.code for w in warnings)
    gained = codes - _prev_codes
    _prev_codes = codes
    if not gained:
        return
    for w in warnings:
        if w.code not in gained:
            continue
        event_log_service.append_event(
            "warning",
            f"{w.code}: {w.message}",
            codes=[w.code],
            source="warning_edge",
        )


def reset_warning_edge_for_tests() -> None:
    global _prev_codes
    _prev_codes = frozenset()


def run_warning_edge_monitor(stop: threading.Event, interval_s: float) -> None:
    while True:
        if stop.wait(timeout=max(0.2, interval_s)):
            break
        try:
            process_new_warnings()
        except Exception as exc:
            logger.exception("Warning edge monitor tick failed")
            event_log_service.append_event(
                "unexpected",
                f"Warning edge monitor tick failed: {exc}",
                source="warning_edge",
            )


def start_warning_edge_monitor_thread(stop: threading.Event) -> threading.Thread:
    interval = settings.alert_poll_interval_s
    t = threading.Thread(
        target=run_warning_edge_monitor,
        args=(stop, interval),
        name="warning-edge-monitor",
        daemon=True,
    )
    t.start()
    return t

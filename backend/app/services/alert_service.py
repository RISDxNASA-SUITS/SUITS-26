"""Background monitor: new warning codes → LLM-phrased alerts for GET /agent/alerts."""

from __future__ import annotations

import json
import logging
import threading
import time
from collections import deque

from app.core.config import settings
from app.models.agent import AgentAlertItem
from app.models.warning import WarningItem
from app.services import event_log_service, llm_client
from app.services.telemetry_service import telemetry_service
from app.services.warning_evaluation import list_warnings

logger = logging.getLogger(__name__)

ALERT_SYSTEM = """You are an EVA safety announcer. Given active warning codes and short facts, produce ONE or TWO short sentences for voice playback.
Plain English only, no markdown, suitable for text-to-speech. Be direct and calm."""

_lock = threading.Lock()
_alerts: deque[AgentAlertItem] = deque(maxlen=max(1, settings.agent_alerts_max))
_prev_codes: frozenset[str] = frozenset()
_seq = 0


def _alert_messages(warnings: list[WarningItem], snapshot_dict: dict) -> list[dict[str, str]]:
    lines = [f"- {w.code} ({w.severity}): {w.message}" for w in warnings]
    payload = json.dumps(snapshot_dict, indent=2)
    user = (
        "New warnings just appeared:\n"
        + "\n".join(lines)
        + "\n\nTelemetry context (subset):\n"
        + payload
        + "\n\nSpeak the alert to the astronaut."
    )
    return [
        {"role": "system", "content": ALERT_SYSTEM},
        {"role": "user", "content": user},
    ]


def _tick() -> None:
    global _prev_codes, _seq
    snap = telemetry_service.get_snapshot()
    warnings = list_warnings(snap)
    codes = frozenset(w.code for w in warnings)
    gained = codes - _prev_codes
    _prev_codes = codes
    if not gained:
        return
    triggered = [w for w in warnings if w.code in gained]
    if not triggered:
        return
    snap_dict = snap.model_dump()
    out = llm_client.chat_completion(_alert_messages(triggered, snap_dict))
    if not out.ok:
        event_log_service.append_event(
            "error",
            f"LLM alert phrasing failed: {out.error_code or 'unknown'}",
            codes=[w.code for w in triggered],
            source="alert_monitor",
        )
    text = out.text if out.ok else "Alert: " + "; ".join(w.message for w in triggered)
    with _lock:
        _seq += 1
        item = AgentAlertItem(
            id=_seq,
            timestamp_unix=time.time(),
            codes=[w.code for w in triggered],
            spoken_text=text,
        )
        _alerts.append(item)
    event_log_service.append_event(
        "alert",
        text,
        codes=item.codes,
        source="alert_monitor",
    )


def list_agent_alerts() -> list[AgentAlertItem]:
    with _lock:
        return list(_alerts)


def reset_agent_alerts_for_tests() -> None:
    """Clear alert history and edge state (tests only)."""
    global _prev_codes, _seq
    with _lock:
        _alerts.clear()
        _seq = 0
    _prev_codes = frozenset()


def run_alert_monitor(stop: threading.Event, interval_s: float) -> None:
    while True:
        if stop.wait(timeout=max(0.2, interval_s)):
            break
        try:
            _tick()
        except Exception as exc:
            logger.exception("Alert monitor tick failed")
            event_log_service.append_event(
                "unexpected",
                f"Alert monitor tick failed: {exc}",
                source="alert_monitor",
            )


def start_alert_monitor_thread(stop: threading.Event) -> threading.Thread | None:
    if not settings.agentic_enabled:
        return None
    interval = settings.alert_poll_interval_s
    t = threading.Thread(
        target=run_alert_monitor,
        args=(stop, interval),
        name="agent-alert-monitor",
        daemon=True,
    )
    t.start()
    return t

"""In-memory system event log for alerts, warnings, errors, and unexpected events."""

from __future__ import annotations

import threading
import time
from collections import deque

from app.core.config import settings
from app.models.system_event import SystemEventItem, SystemEventLevel

_lock = threading.Lock()
_events: deque[SystemEventItem] = deque(maxlen=max(1, settings.system_events_max))
_seq = 0


def append_event(
    level: SystemEventLevel,
    message: str,
    *,
    codes: list[str] | None = None,
    source: str | None = None,
    timestamp_unix: float | None = None,
) -> SystemEventItem:
    global _seq
    with _lock:
        _seq += 1
        item = SystemEventItem(
            id=_seq,
            timestamp_unix=timestamp_unix if timestamp_unix is not None else time.time(),
            level=level,
            message=message,
            codes=list(codes or []),
            source=source,
        )
        _events.append(item)
        return item


def list_events() -> list[SystemEventItem]:
    with _lock:
        return list(reversed(_events))


def reset_events_for_tests() -> None:
    global _seq
    with _lock:
        _events.clear()
        _seq = 0

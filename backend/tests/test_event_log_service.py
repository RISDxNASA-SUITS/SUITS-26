from app.services import event_log_service


def test_append_and_list_newest_first():
    event_log_service.reset_events_for_tests()
    event_log_service.append_event("warning", "Oxygen low", codes=["PRIMARY_O2_LOW"], source="test")
    event_log_service.append_event("error", "Java unreachable", source="java_poller")
    items = event_log_service.list_events()
    assert len(items) == 2
    assert items[0].level == "error"
    assert items[1].level == "warning"
    assert items[1].codes == ["PRIMARY_O2_LOW"]


def test_maxlen_drops_oldest(monkeypatch):
    from collections import deque

    from app.core.config import settings

    monkeypatch.setattr(settings, "system_events_max", 3)
    event_log_service.reset_events_for_tests()
    event_log_service._events = deque(maxlen=3)
    for i in range(5):
        event_log_service.append_event("alert", f"msg-{i}")
    items = event_log_service.list_events()
    assert len(items) == 3
    assert items[0].message == "msg-4"
    assert items[2].message == "msg-2"

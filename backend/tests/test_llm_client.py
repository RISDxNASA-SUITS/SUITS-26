import httpx

from app.services import llm_client


def test_parse_json_object_strips_fence():
    raw = '```json\n{"action": "navigate", "location": "airlock"}\n```'
    obj = llm_client.parse_json_object(raw)
    assert obj["action"] == "navigate"
    assert obj["location"] == "airlock"


def test_parse_json_object_embedded():
    raw = 'Here is JSON: {"x": 1}'
    obj = llm_client.parse_json_object(raw)
    assert obj["x"] == 1


def test_chat_completion_success(monkeypatch):
    def fake_post(self, url, json=None, **kwargs):
        class R:
            status_code = 200

            def raise_for_status(self):
                pass

            def json(self):
                return {"message": {"content": "  hello  "}}

        return R()

    monkeypatch.setattr(httpx.Client, "post", fake_post)
    monkeypatch.setattr(httpx.Client, "__enter__", lambda self: self)
    monkeypatch.setattr(httpx.Client, "__exit__", lambda *a: None)

    out = llm_client.chat_completion([{"role": "user", "content": "hi"}])
    assert out.ok
    assert out.text == "hello"


def test_chat_completion_connect_error(monkeypatch):
    def boom(self, url, json=None, **kwargs):
        raise httpx.ConnectError("nope", request=None)

    monkeypatch.setattr(httpx.Client, "post", boom)
    monkeypatch.setattr(httpx.Client, "__enter__", lambda self: self)
    monkeypatch.setattr(httpx.Client, "__exit__", lambda *a: None)

    out = llm_client.chat_completion([])
    assert not out.ok
    assert out.error_code == "LLM_UNAVAILABLE"


def test_chat_completion_empty_message(monkeypatch):
    def fake_post(self, url, json=None, **kwargs):
        class R:
            status_code = 200

            def raise_for_status(self):
                pass

            def json(self):
                return {"message": {}}

        return R()

    monkeypatch.setattr(httpx.Client, "post", fake_post)
    monkeypatch.setattr(httpx.Client, "__enter__", lambda self: self)
    monkeypatch.setattr(httpx.Client, "__exit__", lambda *a: None)

    out = llm_client.chat_completion([])
    assert not out.ok
    assert out.error_code == "LLM_EMPTY"

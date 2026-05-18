"""HTTP client for Ollama /api/chat — local LLM, no streaming."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


@dataclass(frozen=True)
class LlmOutcome:
    """Result of a chat completion: either assistant text or a user-safe error."""

    text: str
    error_code: str | None = None

    @property
    def ok(self) -> bool:
        return self.error_code is None


def _strip_json_fences(raw: str) -> str:
    s = raw.strip()
    m = re.match(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", s, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return s


def parse_json_object(raw: str) -> dict[str, Any]:
    """Parse first JSON object from model output (handles optional markdown fences)."""
    s = _strip_json_fences(raw)
    try:
        val = json.loads(s)
    except json.JSONDecodeError:
        start = s.find("{")
        end = s.rfind("}")
        if start >= 0 and end > start:
            val = json.loads(s[start : end + 1])
        else:
            raise
    if not isinstance(val, dict):
        raise ValueError("Expected JSON object")
    return val


def chat_completion(
    messages: list[dict[str, str]],
    *,
    base_url: str | None = None,
    model: str | None = None,
    timeout_s: float | None = None,
) -> LlmOutcome:
    """
    POST /api/chat with stream=false. Returns assistant message content or LLM_UNAVAILABLE.
    """
    base = (base_url or settings.ollama_base_url).rstrip("/")
    mdl = model or settings.ollama_model
    timeout = timeout_s if timeout_s is not None else settings.ollama_timeout_s
    url = f"{base}/api/chat"
    payload = {
        "model": mdl,
        "messages": messages,
        "stream": False,
    }
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
    except httpx.TimeoutException:
        return LlmOutcome(
            text="Local language model timed out. Check that Ollama is running and try again.",
            error_code="LLM_TIMEOUT",
        )
    except httpx.ConnectError:
        return LlmOutcome(
            text="Cannot reach local language model. Start Ollama or set EVA_OLLAMA_BASE_URL.",
            error_code="LLM_UNAVAILABLE",
        )
    except httpx.HTTPStatusError as e:
        return LlmOutcome(
            text=f"Language model returned an error ({e.response.status_code}).",
            error_code="LLM_HTTP_ERROR",
        )
    except Exception:
        return LlmOutcome(
            text="Language model request failed.",
            error_code="LLM_UNAVAILABLE",
        )

    msg = data.get("message") if isinstance(data, dict) else None
    content = ""
    if isinstance(msg, dict):
        content = (msg.get("content") or "").strip()
    if not content:
        return LlmOutcome(
            text="Language model returned an empty response.",
            error_code="LLM_EMPTY",
        )
    return LlmOutcome(text=content, error_code=None)

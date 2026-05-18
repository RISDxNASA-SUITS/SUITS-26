"""ASR route tests with mocked Whisper (no model download)."""

from io import BytesIO
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import asr_service


client = TestClient(app)


def test_asr_transcribe_disabled_returns_503() -> None:
    with patch("app.api.routes_asr.settings") as s:
        s.asr_enabled = False
        r = client.post(
            "/asr/transcribe",
            files={"audio": ("x.webm", b"fake", "audio/webm")},
            data={"auto_route_to_command": "true"},
        )
    assert r.status_code == 503


@patch("app.api.routes_asr.asr_service.transcribe_upload")
def test_asr_empty_transcript_safe_error(mock_upload: object) -> None:
    def _fail(*_a, **_k):
        raise asr_service.TranscriptionFailed("empty")

    mock_upload.side_effect = _fail
    with patch("app.api.routes_asr.settings") as s:
        s.asr_enabled = True
        r = client.post(
            "/asr/transcribe",
            files={"audio": ("x.webm", b"x", "audio/webm")},
            data={"auto_route_to_command": "true"},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is False
    assert body["error"]
    assert body["command_result"] is None


@patch("app.api.routes_asr.asr_service.transcribe_upload")
def test_asr_no_auto_route_returns_normalized_only(mock_upload: object) -> None:
    mock_upload.return_value = asr_service.TranscriptionOutcome(
        text="what is my oxygen level",
        avg_logprob=-0.3,
        no_speech_prob=0.1,
    )
    with patch("app.api.routes_asr.settings") as s:
        s.asr_enabled = True
        r = client.post(
            "/asr/transcribe",
            files={"audio": ("c.webm", b"fake", "audio/webm")},
            data={"auto_route_to_command": "false"},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["transcript"] == "what is my oxygen level"
    assert body["normalized_text"] == "oxygen status"
    assert body["command_result"] is None


@patch("app.api.routes_asr.asr_service.transcribe_upload")
def test_asr_auto_route_runs_command_pipeline(mock_upload: object) -> None:
    mock_upload.return_value = asr_service.TranscriptionOutcome(
        text="battery level",
        avg_logprob=-0.2,
        no_speech_prob=0.05,
    )
    with patch("app.api.routes_asr.settings") as s:
        s.asr_enabled = True
        r = client.post(
            "/asr/transcribe",
            files={"audio": ("c.webm", BytesIO(b"x").read(), "audio/webm")},
            data={"auto_route_to_command": "true"},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["normalized_text"] == "battery status"
    assert body["command_result"] is not None
    assert body["command_result"]["intent"] == "status_query"
    assert body["command_result"]["success"] is True
    assert "87.0" in body["command_result"]["response_text"]

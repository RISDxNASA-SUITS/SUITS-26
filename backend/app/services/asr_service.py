"""
Local ASR using faster-whisper (lazy-loaded). CPU-friendly defaults via settings.
"""

from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, BinaryIO

from app.core.config import settings


class TranscriptionFailed(Exception):
    """Transcription empty, unreliable, or ASR unavailable."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class TranscriptionOutcome:
    """Whisper output plus simple quality signals for guardrails."""

    text: str
    avg_logprob: float | None
    no_speech_prob: float | None


_MODEL: Any = None


def _get_model() -> Any:
    global _MODEL
    if not settings.asr_enabled:
        raise TranscriptionFailed("ASR is disabled (set EVA_ASR_ENABLED=true).")
    if _MODEL is None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as e:
            raise TranscriptionFailed(
                "faster-whisper is not installed. Install backend requirements (pip install -r requirements.txt)."
            ) from e
        _MODEL = WhisperModel(
            settings.asr_model_size,
            device=settings.asr_device,
            compute_type=settings.asr_compute_type,
        )
    return _MODEL


def _segments_quality(segments: list[Any]) -> tuple[float | None, list[float]]:
    logprobs: list[float] = []
    for seg in segments:
        lp = getattr(seg, "avg_logprob", None)
        if lp is not None:
            logprobs.append(float(lp))
    if not logprobs:
        return None, []
    return sum(logprobs) / len(logprobs), logprobs


def transcribe_path(audio_path: str | Path) -> TranscriptionOutcome:
    """
    Transcribe audio file on disk. Path should have a sensible suffix (.wav, .webm, .mp3).

    Raises TranscriptionFailed on empty/unreliable results.
    """
    path = Path(audio_path)
    if not path.is_file():
        raise TranscriptionFailed("Audio file is missing or unreadable.")

    model = _get_model()
    try:
        segments, info = model.transcribe(
            str(path),
            language="en",
            task="transcribe",
            vad_filter=True,
        )
    except Exception as exc:
        raise TranscriptionFailed(
            "Unable to confidently transcribe command. Please repeat or use text input."
        ) from exc

    parts: list[str] = []
    seg_list = list(segments)
    for seg in seg_list:
        t = getattr(seg, "text", "") or ""
        parts.append(t.strip())
    text = " ".join(p for p in parts if p).strip()

    no_speech = getattr(info, "no_speech_prob", None)
    if no_speech is not None and float(no_speech) > settings.asr_max_no_speech_prob:
        raise TranscriptionFailed(
            "Unable to confidently transcribe command. Please repeat or use text input."
        )

    avg_lp, logprobs = _segments_quality(seg_list)
    if text and logprobs and avg_lp is not None and avg_lp < settings.asr_min_avg_logprob:
        raise TranscriptionFailed(
            "Unable to confidently transcribe command. Please repeat or use text input."
        )

    if not text:
        raise TranscriptionFailed(
            "Unable to confidently transcribe command. Please repeat or use text input."
        )

    return TranscriptionOutcome(
        text=text,
        avg_logprob=avg_lp,
        no_speech_prob=float(no_speech) if no_speech is not None else None,
    )


def transcribe_upload(fileobj: BinaryIO, suffix: str) -> TranscriptionOutcome:
    """Spool upload to a temp file and transcribe."""
    import os

    suf = suffix if suffix.startswith(".") else f".{suffix}"
    if suf.lower() not in (".wav", ".webm", ".mp3", ".ogg", ".m4a", ".flac"):
        suf = ".webm"
    fd, tmp_path = tempfile.mkstemp(suffix=suf)
    tmp_path = Path(tmp_path)
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = fileobj.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        try:
            return transcribe_path(tmp_path)
        except TranscriptionFailed:
            raise
        except Exception as exc:
            raise TranscriptionFailed(
                "Unable to confidently transcribe command. Please repeat or use text input."
            ) from exc
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except OSError:
            pass

"""Speech-to-text and optional routing into the deterministic command pipeline."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.models.asr import AsrCommandResultPayload, AsrTranscribeResponse
from app.services import asr_service
from app.services.command_normalizer import normalize_eva_command
from app.services.command_dispatch import run_command_pipeline

router = APIRouter(prefix="/asr", tags=["asr"])


@router.post("/transcribe", response_model=AsrTranscribeResponse)
async def transcribe(
    audio: UploadFile = File(..., description="Short recording: wav, webm, mp3, ogg, …"),
    auto_route_to_command: bool = Form(
        True,
        description="If true, run normalized text through the same pipeline as POST /command.",
    ),
) -> AsrTranscribeResponse:
    if not settings.asr_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ASR is disabled. Set EVA_ASR_ENABLED=true and restart the API.",
        )

    filename = audio.filename or "clip"
    suffix = Path(filename).suffix.lower() or ".webm"

    try:
        outcome = asr_service.transcribe_upload(audio.file, suffix)
    except asr_service.TranscriptionFailed as e:
        return AsrTranscribeResponse(
            success=False,
            transcript="",
            normalized_text="",
            error=e.message,
            command_result=None,
        )

    transcript = outcome.text
    normalized = normalize_eva_command(transcript)
    if not normalized:
        return AsrTranscribeResponse(
            success=False,
            transcript=transcript,
            normalized_text="",
            error="Unable to confidently transcribe command. Please repeat or use text input.",
            command_result=None,
        )

    if not auto_route_to_command:
        return AsrTranscribeResponse(
            success=True,
            transcript=transcript,
            normalized_text=normalized,
            error=None,
            command_result=None,
            avg_logprob=outcome.avg_logprob,
        )

    cmd = run_command_pipeline(normalized)
    command_result = AsrCommandResultPayload(
        intent=cmd.parsed_intent,
        response_text=cmd.response_text,
        success=cmd.success,
        error_code=cmd.error_code,
        entity=cmd.entity,
    )
    return AsrTranscribeResponse(
        success=True,
        transcript=transcript,
        normalized_text=normalized,
        error=None,
        command_result=command_result,
        avg_logprob=outcome.avg_logprob,
    )

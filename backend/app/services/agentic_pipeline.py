"""LLM router: navigate demo vs telemetry Q&A from current snapshot."""

from __future__ import annotations

import json
import logging
from typing import Any, Literal

from app.models.response import CommandResponse
from app.services import llm_client
from app.services.navigation_demo import navigate
from app.services.telemetry_service import telemetry_service

logger = logging.getLogger(__name__)

RouterAction = Literal["navigate", "telemetry", "unknown"]

ROUTER_SYSTEM = """You are an intent router for a lunar EVA voice assistant.
Classify the user's latest utterance into exactly one action:
- "navigate": user wants to go somewhere (e.g. "take me to", "navigate to", "head to", "go to").
- "telemetry": user asks about suit/system status (oxygen, battery, CO2, comms, distance, vehicle, warnings).
- "unknown": anything else or ambiguous.

Reply with ONLY a single JSON object, no markdown, no other text:
{"action":"navigate"|"telemetry"|"unknown","location":string|null,"reason":string|null}
Rules:
- For navigate, set "location" to the destination phrase (short). If missing, null.
- For telemetry or unknown, "location" must be null.
- "reason" is optional short note for logging; may be null."""

TELEMETRY_SYSTEM = """You are EVA suit telemetry voice assistant. Answer ONLY using the JSON data provided.
If the data does not contain the answer, say you cannot determine from current telemetry.
Keep answers to one or two short sentences, plain text, suitable for text-to-speech (spell out units, avoid symbols like subscripts)."""


def _router_messages(user_text: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": ROUTER_SYSTEM},
        {"role": "user", "content": user_text.strip()},
    ]


def _telemetry_messages(snapshot: dict[str, Any], question: str) -> list[dict[str, str]]:
    payload = json.dumps(snapshot, indent=2)
    return [
        {"role": "system", "content": TELEMETRY_SYSTEM},
        {
            "role": "user",
            "content": f"Telemetry JSON:\n{payload}\n\nUser question: {question.strip()}",
        },
    ]


def _parse_router(raw: str) -> tuple[RouterAction, str | None, str | None]:
    try:
        obj = llm_client.parse_json_object(raw)
    except (ValueError, json.JSONDecodeError) as e:
        logger.warning("Router JSON parse failed: %s", e)
        return "unknown", None, None
    action = obj.get("action")
    if action not in ("navigate", "telemetry", "unknown"):
        return "unknown", None, None
    loc = obj.get("location")
    location = str(loc).strip() if loc is not None and str(loc).strip() else None
    reason = obj.get("reason")
    r = str(reason).strip() if reason is not None and str(reason).strip() else None
    return action, location if action == "navigate" else None, r


def run_agentic_pipeline(input_text: str) -> CommandResponse:
    raw_in = input_text.strip()
    if not raw_in:
        return CommandResponse(
            success=False,
            error_code="EMPTY_INPUT",
            input_text=input_text,
            parsed_intent="agent_unknown",
            entity=None,
            response_text="Say a command or question.",
        )

    out = llm_client.chat_completion(_router_messages(raw_in))
    if not out.ok:
        return CommandResponse(
            success=False,
            error_code=out.error_code or "LLM_UNAVAILABLE",
            input_text=input_text,
            parsed_intent="agent_router",
            entity=None,
            response_text=out.text,
        )

    action, location, _reason = _parse_router(out.text)

    if action == "navigate":
        text = navigate(location or "")
        return CommandResponse(
            success=True,
            error_code=None,
            input_text=input_text,
            parsed_intent="agent_navigate",
            entity=location,
            response_text=text,
        )

    if action == "telemetry":
        if not telemetry_service.is_available():
            return CommandResponse(
                success=False,
                error_code="TELEMETRY_UNAVAILABLE",
                input_text=input_text,
                parsed_intent="agent_telemetry",
                entity=None,
                response_text="Telemetry unavailable. Unable to answer status questions.",
            )
        snap = telemetry_service.get_snapshot()
        snap_dict: dict[str, Any] = snap.model_dump()
        t_out = llm_client.chat_completion(_telemetry_messages(snap_dict, raw_in))
        if not t_out.ok:
            return CommandResponse(
                success=False,
                error_code=t_out.error_code or "LLM_UNAVAILABLE",
                input_text=input_text,
                parsed_intent="agent_telemetry",
                entity=None,
                response_text=t_out.text,
            )
        return CommandResponse(
            success=True,
            error_code=None,
            input_text=input_text,
            parsed_intent="agent_telemetry",
            entity=None,
            response_text=t_out.text,
        )

    # unknown
    return CommandResponse(
        success=True,
        error_code=None,
        input_text=input_text,
        parsed_intent="agent_unknown",
        entity=None,
        response_text=(
            "I did not understand. Try asking for suit status (for example oxygen or battery) "
            "or say navigate to a destination."
        ),
    )

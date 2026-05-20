"""
Structured rule-based command parser.

Rules are evaluated top-to-bottom on normalized text (lowercase, collapsed whitespace).
First match wins. No ML/LLM.
"""

import re

from app.models.parse_result import ParseResult


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def parse_command(raw_text: str) -> ParseResult:
    """
    Return intent, optional entity, and raw_text (trimmed user input).

    Intents: status_query, procedure_start, procedure_next, procedure_repeat,
    diagnosis_request, warning_check, mission_phase_check, help, unknown.
    """
    raw = raw_text.strip()
    n = _normalize(raw_text)

    if not n:
        return ParseResult(intent="unknown", entity=None, raw_text=raw)

    # --- help (exact) ---
    if n == "help":
        return ParseResult(intent="help", entity=None, raw_text=raw)

    # --- mission phase (before generic "phase" would collide) ---
    if n in (
        "what phase am i in",
        "what phase",
        "mission phase",
        "phase",
    ):
        return ParseResult(intent="mission_phase_check", entity=None, raw_text=raw)

    # --- status_query (explicit phrases) ---
    if n in ("oxygen status", "what is my oxygen"):
        return ParseResult(intent="status_query", entity="oxygen", raw_text=raw)
    if n == "battery status":
        return ParseResult(intent="status_query", entity="battery", raw_text=raw)
    if n == "co2 status":
        return ParseResult(intent="status_query", entity="co2", raw_text=raw)

    # --- procedure_start ---
    if n in ("start egress", "start egress procedure"):
        return ParseResult(intent="procedure_start", entity="egress", raw_text=raw)
    if n == "start erm":
        return ParseResult(intent="procedure_start", entity="erm", raw_text=raw)
    if n == "start repair":
        return ParseResult(intent="procedure_start", entity="repair", raw_text=raw)
    if n in ("start ingress", "start ingress procedure"):
        return ParseResult(intent="procedure_start", entity="ingress", raw_text=raw)

    # --- procedure step ---
    if n == "next step":
        return ParseResult(intent="procedure_next", entity=None, raw_text=raw)
    if n == "repeat step":
        return ParseResult(intent="procedure_repeat", entity=None, raw_text=raw)

    # --- diagnosis / warnings ---
    if n == "run diagnosis":
        return ParseResult(intent="diagnosis_request", entity=None, raw_text=raw)
    if n == "any warnings":
        return ParseResult(intent="warning_check", entity=None, raw_text=raw)

    return ParseResult(intent="unknown", entity=None, raw_text=raw)

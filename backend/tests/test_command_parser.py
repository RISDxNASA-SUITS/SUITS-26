"""
Intent recognition, phrase mapping, and unknown handling for the rule-based parser.
"""

import pytest

from app.services.command_parser import parse_command


@pytest.mark.parametrize(
    ("text", "intent", "entity"),
    [
        ("help", "help", None),
        ("HELP", "help", None),
        ("what phase am i in", "mission_phase_check", None),
        ("what phase", "mission_phase_check", None),
        ("mission phase", "mission_phase_check", None),
        ("phase", "mission_phase_check", None),
        ("oxygen status", "status_query", "oxygen"),
        ("what is my oxygen", "status_query", "oxygen"),
        ("battery status", "status_query", "battery"),
        ("co2 status", "status_query", "co2"),
        ("start egress", "procedure_start", "egress"),
        ("start egress procedure", "procedure_start", "egress"),
        ("start erm", "procedure_start", "erm"),
        ("start repair", "procedure_start", "repair"),
        ("start ingress", "procedure_start", "ingress"),
        ("next step", "procedure_next", None),
        ("repeat step", "procedure_repeat", None),
        ("guide me back", "navigation_return", None),
        ("return route", "navigation_return", None),
        ("run diagnosis", "diagnosis_request", None),
        ("any warnings", "warning_check", None),
    ],
)
def test_phrase_maps_to_intent_and_entity(text, intent, entity):
    r = parse_command(text)
    assert r.intent == intent
    assert r.entity == entity
    assert r.raw_text == text.strip()


def test_unknown_gibberish():
    r = parse_command("open the pod bay doors")
    assert r.intent == "unknown"
    assert r.entity is None


def test_unknown_empty_after_normalize():
    r = parse_command("   ")
    assert r.intent == "unknown"
    assert r.entity is None


@pytest.mark.parametrize(
    "text",
    [
        "maybe oxygen",
        "status",
        "start procedure",
        "warnings",
    ],
)
def test_unknown_partial_phrases(text):
    assert parse_command(text).intent == "unknown"


def test_whitespace_normalization_matches():
    r = parse_command("Oxygen    STATUS")
    assert r.intent == "status_query"
    assert r.entity == "oxygen"

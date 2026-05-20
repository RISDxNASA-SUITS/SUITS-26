"""Tests for deterministic EVA phrase normalization (ASR → parser)."""

import pytest

from app.services.command_normalizer import normalize_eva_command


@pytest.mark.parametrize(
    "raw,expected",
    [
        # Oxygen — must all become "oxygen status" for parser
        ("What's my oxygen level?", "oxygen status"),
        ("What's my Oxygen status?", "oxygen status"),
        ("what is my oxygen status", "oxygen status"),
        ("what's my oxygen level?", "oxygen status"),
        ("what is my oxygen level", "oxygen status"),
        ("what is my oxygen level?", "oxygen status"),
        ("what's my oxygen", "oxygen status"),
        ("what is my oxygen", "oxygen status"),
        ("what's my o2", "oxygen status"),
        ("what is my o2", "oxygen status"),
        ("what's my o2 level", "oxygen status"),
        ("oxygen level", "oxygen status"),
        ("o2 status", "oxygen status"),
        ("oxygen status", "oxygen status"),
        # Smart apostrophe (U+2019) as produced by some ASR/UI
        ("What\u2019s my oxygen level?", "oxygen status"),
        # Battery
        ("what's my battery", "battery status"),
        ("what is my battery", "battery status"),
        ("what's my battery level?", "battery status"),
        ("what is my battery status", "battery status"),
        ("battery level", "battery status"),
        ("my battery", "battery status"),
        ("battery status", "battery status"),
        # Other EVA phrases (unchanged)
        ("start u i a procedure", "start egress"),
        ("start uia", "start egress"),
        ("start e r m", "start erm"),
        ("run diagnostic", "run diagnosis"),
        ("run diagnostics", "run diagnosis"),
        ("any alerts", "any warnings"),
        ("any alert", "any warnings"),
    ],
)
def test_normalize_maps_phrases(raw: str, expected: str) -> None:
    assert normalize_eva_command(raw) == expected


def test_whats_my_oxygen_level_question_mark() -> None:
    """Regression: ASR sentence punctuation + contraction must map to oxygen status."""
    assert normalize_eva_command("What's my oxygen level?") == "oxygen status"


def test_unknown_phrase_passes_through_collapsed() -> None:
    assert normalize_eva_command("  hello   world  ") == "hello world"

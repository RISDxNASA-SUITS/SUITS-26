"""
Deterministic EVA vocabulary normalization for ASR transcripts.

Maps alternate phrasings to canonical strings understood by command_parser.
Raw ASR text must never bypass this layer before parsing.
"""

from __future__ import annotations

import re
import unicodedata

# Collapse letter-spelled acronyms (e.g. "u i a" -> "uia") for downstream rules.
_ACRONYM_SPACING: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bu\s+i\s+a\b", re.I), "uia"),
    (re.compile(r"\be\s+r\s*m\b", re.I), "erm"),
    (re.compile(r"\bd\s+c\s+u\b", re.I), "dcu"),
    (re.compile(r"\bl\s+t\s+v\b", re.I), "ltv"),
    (re.compile(r"\bp\s+r\b", re.I), "pr"),
    (re.compile(r"\bc\s+o\s+2\b", re.I), "co2"),
    (re.compile(r"\bo\s+2\b", re.I), "o2"),
]

# After preprocessing, match whole string to a canonical parser phrase.
_PHRASE_RULES: list[tuple[re.Pattern[str], str]] = [
    # Oxygen / O₂ — canonical: "oxygen status" (parser also accepts "what is my oxygen")
    # ASR often says "oxygen status" / "o2 status" at end — accept level|status after my o2/oxygen
    (re.compile(r"^what is my o2(\s+(level|status))?$", re.I), "oxygen status"),
    (re.compile(r"^what is my oxygen(\s+(level|status))?$", re.I), "oxygen status"),
    (re.compile(r"^my o2(\s+(level|status))?$", re.I), "oxygen status"),
    (re.compile(r"^my oxygen(\s+(level|status))?$", re.I), "oxygen status"),
    (re.compile(r"^oxygen level$", re.I), "oxygen status"),
    (re.compile(r"^o2\s+status$", re.I), "oxygen status"),
    (re.compile(r"^oxygen status$", re.I), "oxygen status"),
    # Battery — canonical: "battery status"
    (re.compile(r"^what is my battery(\s+(level|status))?$", re.I), "battery status"),
    (re.compile(r"^my battery(\s+(level|status))?$", re.I), "battery status"),
    (re.compile(r"^battery level$", re.I), "battery status"),
    (re.compile(r"^battery status$", re.I), "battery status"),
    # Procedures / diagnosis / warnings
    (re.compile(r"^start\s+uia(\s+procedure)?$", re.I), "start egress"),
    (re.compile(r"^start\s+egress\s+uia$", re.I), "start egress"),
    (re.compile(r"^start\s+erm$", re.I), "start erm"),
    (re.compile(r"^start\s+e\s*r\s*m$", re.I), "start erm"),
    (re.compile(r"^run diagnostics?$", re.I), "run diagnosis"),
    (re.compile(r"^run diagnostic$", re.I), "run diagnosis"),
    (re.compile(r"^any alerts?$", re.I), "any warnings"),
]


def _collapse_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip()).strip()


def _to_ascii_apostrophe(s: str) -> str:
    """Map curly/smart apostrophes to ASCII so contractions normalize consistently."""
    for ch in ("\u2018", "\u2019", "\u02bc", "\u2032"):
        s = s.replace(ch, "'")
    return s


def _strip_edge_punct(s: str) -> str:
    """Remove ASR/sentence punctuation around the command (keep inner apostrophes until expanded)."""
    t = s.strip()
    # Strip repeated trailing/leading quote and sentence closers
    edge = "\"'\"'“”‘’`¡¿（）()[]<>"
    punct_end = "?!.;:,，。、"
    while t and t[0] in edge:
        t = t[1:].lstrip()
    while t and t[-1] in punct_end + edge:
        t = t[:-1].rstrip()
    return t.strip()


def _expand_contractions(t: str) -> str:
    """Normalize common English contractions for matching (deterministic, small set)."""
    # Word-boundary: what's / what're -> what is / what are (only what's needed for EVA phrases)
    t = re.sub(r"\bwhat's\b", "what is", t, flags=re.I)
    t = re.sub(r"\bwhere's\b", "where is", t, flags=re.I)
    t = re.sub(r"\bhow's\b", "how is", t, flags=re.I)
    t = re.sub(r"\bthat's\b", "that is", t, flags=re.I)
    t = re.sub(r"\bit's\b", "it is", t, flags=re.I)
    return t


def normalize_eva_command(raw: str) -> str:
    """
    Return a single-line string suitable for parse_command after ASR.

    Normalizes Unicode, case, punctuation, and contractions, then applies acronym and phrase rules.
    Unknown phrasing is passed through (parser may still classify as unknown).
    """
    if not raw or not raw.strip():
        return ""
    t = unicodedata.normalize("NFKC", raw)
    t = t.strip().lower()
    t = _to_ascii_apostrophe(t)
    t = _collapse_ws(t)
    t = _strip_edge_punct(t)
    t = _expand_contractions(t)
    t = _collapse_ws(t)
    t = _strip_edge_punct(t)
    t = _collapse_ws(t)
    for pat, repl in _ACRONYM_SPACING:
        t = pat.sub(repl, t)
    t = _collapse_ws(t)
    for pat, repl in _PHRASE_RULES:
        if pat.match(t):
            return repl
    return t

#!/usr/bin/env python3
"""Validate AIA config and Java Hub reachability before starting uvicorn."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    import httpx
except ImportError:
    print("ERROR: httpx not installed. Run: pip install -r backend/requirements.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / "backend" / ".env"

ENV_LINE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$")


def load_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        print(f"ERROR: Missing {path}", file=sys.stderr)
        print("  Run: cp backend/.env.example backend/.env", file=sys.stderr)
        sys.exit(1)

    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        match = ENV_LINE.match(line)
        if not match:
            print(f"ERROR: Invalid line in {path}: {raw!r}", file=sys.stderr)
            sys.exit(1)
        key, value = match.group(1), match.group(2).strip()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        values[key] = value
    return values


def parse_bool(raw: str | None, default: bool) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def validate_java_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        print(f"ERROR: EVA_JAVA_BACKEND_URL must be http(s): {url!r}", file=sys.stderr)
        sys.exit(1)
    if not parsed.netloc:
        print(f"ERROR: EVA_JAVA_BACKEND_URL missing host: {url!r}", file=sys.stderr)
        sys.exit(1)
    return url.rstrip("/")


def check_hub(base_url: str, timeout_s: float) -> None:
    probe = f"{base_url}/ev-telemetry/1"
    try:
        with httpx.Client(timeout=timeout_s) as client:
            response = client.get(probe)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        print("ERROR: Cannot reach Java Hub (is java-backend running?)", file=sys.stderr)
        print(f"  Probe: {probe}", file=sys.stderr)
        print(f"  Detail: {exc}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, dict):
        print("ERROR: Hub returned unexpected JSON (expected object).", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    env = load_env_file(ENV_PATH)

    java_url = validate_java_url(
        env.get("EVA_JAVA_BACKEND_URL", "http://localhost:7070"),
    )
    live = parse_bool(env.get("EVA_LIVE_TELEMETRY"), True)
    timeout_s = float(env.get("EVA_JAVA_HTTP_TIMEOUT_S", "3"))

    if live:
        check_hub(java_url, timeout_s)
        print(f"OK: Hub reachable at {java_url}")
    else:
        print("OK: EVA_LIVE_TELEMETRY=false — starting in mock telemetry mode (Hub not required).")

    print("OK: AIA configuration is valid.")


if __name__ == "__main__":
    main()

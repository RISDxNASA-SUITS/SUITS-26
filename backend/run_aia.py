#!/usr/bin/env python3
"""Start the EVA AIA API with host/port flags for the server and Java hub.

Examples:
  python run_aia.py
  python run_aia.py --java-host 127.0.0.1 --java-port 7071
  python run_aia.py --host 0.0.0.0 --port 8000 --java-host 192.0.0.2 --java-port 7071 --reload
  python run_aia.py --java-url http://192.168.1.10:7070 --java-transport http
"""

from __future__ import annotations

import argparse
import os
import sys


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run EVA AIA (FastAPI) with configurable networking.")
    p.add_argument(
        "--host",
        default=os.environ.get("EVA_BIND_HOST", "0.0.0.0"),
        help="Address for uvicorn to bind (default: 0.0.0.0).",
    )
    p.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("EVA_BIND_PORT", "8000")),
        help="Port for the AIA API (default: 8000).",
    )
    p.add_argument(
        "--java-host",
        default=os.environ.get("EVA_JAVA_HOST", "127.0.0.1"),
        help="Java hub hostname or IP (default: 127.0.0.1). Ignored if --java-url is set.",
    )
    p.add_argument(
        "--java-port",
        type=int,
        default=int(os.environ.get("EVA_JAVA_PORT", "7070")),
        help="Java hub HTTP port (default: 7070). Ignored if --java-url is set.",
    )
    p.add_argument(
        "--java-url",
        default=None,
        help="Full Java base URL, e.g. http://192.0.0.2:7071 (overrides --java-host/--java-port).",
    )
    p.add_argument(
        "--java-transport",
        choices=("websocket", "http"),
        default=os.environ.get("EVA_JAVA_TELEMETRY_TRANSPORT", "websocket"),
        help="How AIA ingests live telemetry from Java (default: websocket).",
    )
    p.add_argument(
        "--java-ws-url",
        default=os.environ.get("EVA_JAVA_BACKEND_WS_URL"),
        help="Optional mission WebSocket URL (default: derived from Java base URL).",
    )
    p.add_argument(
        "--ollama-host",
        default=os.environ.get("EVA_OLLAMA_HOST", "127.0.0.1"),
        help="Ollama hostname (default: 127.0.0.1). Ignored if --ollama-url is set.",
    )
    p.add_argument(
        "--ollama-port",
        type=int,
        default=int(os.environ.get("EVA_OLLAMA_PORT", "11434")),
        help="Ollama HTTP port (default: 11434). Ignored if --ollama-url is set.",
    )
    p.add_argument(
        "--ollama-url",
        default=None,
        help="Full Ollama base URL, e.g. http://127.0.0.1:11434",
    )
    p.add_argument("--reload", action="store_true", help="Enable uvicorn auto-reload for development.")
    return p.parse_args()


def _apply_env(args: argparse.Namespace) -> None:
    java_base = (args.java_url or f"http://{args.java_host}:{args.java_port}").rstrip("/")
    ollama_base = (args.ollama_url or f"http://{args.ollama_host}:{args.ollama_port}").rstrip("/")

    os.environ["EVA_JAVA_BACKEND_URL"] = java_base
    os.environ["EVA_JAVA_TELEMETRY_TRANSPORT"] = args.java_transport
    if args.java_ws_url:
        os.environ["EVA_JAVA_BACKEND_WS_URL"] = args.java_ws_url
    else:
        os.environ.pop("EVA_JAVA_BACKEND_WS_URL", None)

    os.environ["EVA_OLLAMA_BASE_URL"] = ollama_base

    print(f"AIA API       http://{args.host}:{args.port}")
    print(f"Java hub      {java_base}  (transport={args.java_transport})")
    if args.java_ws_url:
        print(f"Java mission WS {args.java_ws_url}")
    else:
        ws_scheme = "wss" if java_base.startswith("https://") else "ws"
        ws_host = java_base.split("://", 1)[-1]
        print(f"Java mission WS {ws_scheme}://{ws_host}/telemetry/mission/live")
    print(f"Ollama        {ollama_base}")


def main() -> None:
    args = _parse_args()
    _apply_env(args)

    try:
        import uvicorn
    except ModuleNotFoundError:
        exe = sys.executable
        print(
            "uvicorn is not installed for this Python interpreter.\n"
            f"  sys.executable = {exe}\n"
            "Fix (use the same interpreter for pip and run_aia):\n"
            f"  {exe} -m pip install -r requirements.txt\n"
            "Or:  python -m pip install 'uvicorn[standard]>=0.27,<1'\n"
            "If you use conda, create a clean venv: python3 -m venv .venv && source .venv/bin/activate",
            file=sys.stderr,
        )
        sys.exit(1)

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()

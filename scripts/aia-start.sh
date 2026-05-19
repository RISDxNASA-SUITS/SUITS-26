#!/usr/bin/env bash
# Start AIA (EVA API) only if config + Hub preflight pass; otherwise exit immediately.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
RUN_DIR="$BACKEND/.run"
PID_FILE="$RUN_DIR/aia-uvicorn.pid"
LOG_FILE="$RUN_DIR/aia.log"
PORT="${EVA_PORT:-8000}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/aia-start.sh              Start AIA (background)
  ./scripts/aia-start.sh --foreground Start AIA in this terminal (foreground)
  ./scripts/aia-start.sh --help       Show this help

Stop:
  ./scripts/aia-stop.sh

Preflight (auto, before start):
  - Invalid backend/.env  → exit, AIA does not start
  - Hub unreachable when EVA_LIVE_TELEMETRY=true → exit, AIA does not start
  - All checks pass → uvicorn on http://0.0.0.0:8000
EOF
}

fail() {
  echo "AIA start aborted: $*" >&2
  exit 1
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

FOREGROUND=0
if [[ "${1:-}" == "--foreground" || "${1:-}" == "-f" ]]; then
  FOREGROUND=1
elif [[ -n "${1:-}" ]]; then
  echo "ERROR: Unknown argument: $1" >&2
  usage >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE")"
  if kill -0 "$old_pid" 2>/dev/null; then
    fail "AIA already running (pid $old_pid). Run ./scripts/aia-stop.sh first."
  fi
  rm -f "$PID_FILE"
fi

if ! command -v python3 >/dev/null 2>&1; then
  fail "python3 not found."
fi

if lsof -i ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  fail "Port $PORT is already in use."
fi

cd "$BACKEND"
if [[ ! -d .venv ]]; then
  echo "Creating Python venv..."
  python3 -m venv .venv
fi
# shellcheck source=/dev/null
source .venv/bin/activate
pip install -q -r requirements.txt

echo "Running AIA preflight..."
if ! python3 "$ROOT/scripts/aia-preflight.py"; then
  fail "preflight failed."
fi

mkdir -p "$RUN_DIR"

if [[ "$FOREGROUND" -eq 1 ]]; then
  echo "AIA API (foreground) → http://0.0.0.0:$PORT  (docs: /docs)"
  trap 'rm -f "$PID_FILE"' EXIT
  echo $$ >"$PID_FILE"
  exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
fi

echo "Starting AIA API in background → http://0.0.0.0:$PORT"
nohup uvicorn app.main:app --host 0.0.0.0 --port "$PORT" >"$LOG_FILE" 2>&1 &
child_pid=$!
echo "$child_pid" >"$PID_FILE"

# Post-start: API up and Hub still OK when live telemetry is on.
ready=0
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$child_pid" 2>/dev/null; then
    fail "uvicorn exited during startup. See $LOG_FILE"
  fi
  sleep 0.5
done

if [[ "$ready" -ne 1 ]]; then
  kill "$child_pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  fail "AIA did not become healthy within 15s. See $LOG_FILE"
fi

live_on="$(python3 -c "
from pathlib import Path
import re
text = Path('$BACKEND/.env').read_text()
m = re.search(r'^EVA_LIVE_TELEMETRY\s*=\s*(.+)$', text, re.M)
if not m:
    print('true')
else:
    print('true' if m.group(1).strip().lower() in ('1','true','yes','on') else 'false')
")"
if [[ "$live_on" == "true" ]]; then
  hub_ok="$(curl -sf "http://127.0.0.1:$PORT/agent/status" | python3 -c "import sys,json; print(json.load(sys.stdin).get('java_backend_reachable', False))" || echo False)"
  if [[ "$hub_ok" != "True" && "$hub_ok" != "true" ]]; then
    kill "$child_pid" 2>/dev/null || true
    rm -f "$PID_FILE"
    fail "AIA started but Hub is not reachable (java_backend_reachable=false). Stopped."
  fi
fi

echo "AIA running (pid $child_pid). Logs: $LOG_FILE"
echo "Stop with: ./scripts/aia-stop.sh"

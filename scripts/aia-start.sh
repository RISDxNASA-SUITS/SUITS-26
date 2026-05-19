#!/usr/bin/env bash
# Start AIA (EVA API) after you enter the Java Hub machine IP. No Docker required.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
RUN_DIR="$BACKEND/.run"
PID_FILE="$RUN_DIR/aia-uvicorn.pid"
LOG_FILE="$RUN_DIR/aia.log"
PORT="${EVA_PORT:-8000}"
JAVA_PORT="${JAVA_HUB_PORT:-7070}"

usage() {
  cat <<EOF
Usage:
  ./scripts/aia-start.sh [JAVA_IP]              Start AIA (asks for IP if omitted)
  ./scripts/aia-start.sh [JAVA_IP] --foreground Start in foreground (Ctrl+C to stop)
  ./scripts/aia-start.sh --help                 Show this help

Examples:
  ./scripts/aia-start.sh 192.168.1.20
  ./scripts/aia-start.sh 192.168.1.20:7070
  ./scripts/aia-start.sh                        (prompts: Java Hub IP address:)

Stop:
  ./scripts/aia-stop.sh

Before start:
  1. Java Hub must already be running on the machine at JAVA_IP (port ${JAVA_PORT}).
  2. Script checks Hub, then starts AIA on http://0.0.0.0:${PORT}
  3. If IP wrong or Hub down → exits immediately (AIA does not stay running).
EOF
}

fail() {
  echo "AIA start aborted: $*" >&2
  exit 1
}

# Parse host from 192.168.1.20 or 192.168.1.20:7070 or http://...
normalize_java_host() {
  local raw="$1"
  raw="${raw#http://}"
  raw="${raw#https://}"
  if [[ "$raw" == *:* ]]; then
    JAVA_IP="${raw%%:*}"
    JAVA_PORT="${raw#*:}"
  else
    JAVA_IP="$raw"
  fi
}

validate_ipv4() {
  local ip="$1"
  if [[ ! "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    return 1
  fi
  local o
  for o in ${ip//./ }; do
    if (( o < 0 || o > 255 )); then
      return 1
    fi
  done
  return 0
}

write_java_url_to_env() {
  local url="http://${JAVA_IP}:${JAVA_PORT}"
  if [[ ! -f "$BACKEND/.env" ]]; then
    if [[ -f "$BACKEND/.env.example" ]]; then
      cp "$BACKEND/.env.example" "$BACKEND/.env"
    else
      fail "Missing backend/.env — create it or add backend/.env.example"
    fi
  fi
  export EVA_JAVA_BACKEND_URL="$url"
  python3 - <<PY
from pathlib import Path
import re

path = Path("${BACKEND}/.env")
url = "${url}"
text = path.read_text(encoding="utf-8")
if re.search(r"^EVA_JAVA_BACKEND_URL\s*=", text, flags=re.M):
    text = re.sub(r"^EVA_JAVA_BACKEND_URL\s*=.*$", f"EVA_JAVA_BACKEND_URL={url}", text, flags=re.M)
else:
    text = text.rstrip() + f"\nEVA_JAVA_BACKEND_URL={url}\n"
path.write_text(text, encoding="utf-8")
print(f"Using Java Hub at {url}")
PY
}

FOREGROUND=0
JAVA_IP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help | -h)
      usage
      exit 0
      ;;
    --foreground | -f)
      FOREGROUND=1
      shift
      ;;
    -*)
      fail "Unknown option: $1"
      ;;
    *)
      if [[ -n "$JAVA_IP" ]]; then
        fail "Unexpected extra argument: $1"
      fi
      normalize_java_host "$1"
      shift
      ;;
  esac
done

if [[ -z "$JAVA_IP" ]]; then
  echo "Java Hub runs on another machine (no Docker needed on this laptop)."
  read -rp "Java Hub IP address: " JAVA_IP
  JAVA_IP="$(echo "$JAVA_IP" | tr -d '[:space:]')"
  if [[ -z "$JAVA_IP" ]]; then
    fail "No IP entered."
  fi
  if [[ "$JAVA_IP" == *:* ]]; then
    normalize_java_host "$JAVA_IP"
  fi
fi

if ! validate_ipv4 "$JAVA_IP"; then
  fail "Invalid IP address: $JAVA_IP"
fi

if [[ ! "$JAVA_PORT" =~ ^[0-9]+$ ]] || (( JAVA_PORT < 1 || JAVA_PORT > 65535 )); then
  fail "Invalid port: $JAVA_PORT"
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

write_java_url_to_env

cd "$BACKEND"
if [[ ! -d .venv ]]; then
  echo "Creating Python venv..."
  python3 -m venv .venv
fi
# shellcheck source=/dev/null
source .venv/bin/activate
pip install -q -r requirements.txt

echo "Running AIA preflight (checking Java Hub)..."
if ! python3 "$ROOT/scripts/aia-preflight.py" --java-url "$EVA_JAVA_BACKEND_URL"; then
  fail "preflight failed — is Java Hub running at $EVA_JAVA_BACKEND_URL ?"
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
    fail "AIA started but Hub is not reachable. Stopped."
  fi
fi

echo "AIA running (pid $child_pid). Hub: $EVA_JAVA_BACKEND_URL"
echo "Logs: $LOG_FILE"
echo "Stop with: ./scripts/aia-stop.sh"

#!/usr/bin/env bash
# Stop AIA (uvicorn) started by aia-start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/backend/.run/aia-uvicorn.pid"

stopped=0

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "Stopped AIA (pid $pid)."
    stopped=1
  else
    echo "Stale PID file (process $pid not running)."
  fi
  rm -f "$PID_FILE"
fi

# Fallback for processes started without PID file
if pkill -f "uvicorn app.main:app" 2>/dev/null; then
  if [[ "$stopped" -eq 0 ]]; then
    echo "Stopped AIA (uvicorn) via process match."
  fi
  stopped=1
fi

if [[ "$stopped" -eq 0 ]]; then
  echo "AIA was not running."
fi

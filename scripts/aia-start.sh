#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi
if [[ ! -f .env ]]; then
  echo "Missing backend/.env — run: cp backend/.env.example backend/.env"
  exit 1
fi
echo "AIA API → http://0.0.0.0:8000  (docs: /docs)"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

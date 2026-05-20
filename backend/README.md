# Backend — EVA AIA API

FastAPI service: `POST /command`, in-memory **mission**, **telemetry**, **procedures** (YAML), **warnings**, and **guardrails**. No database. Optional **agentic** path uses a local **Ollama** LLM (see root README).

## Demo mode and defaults

| `EVA_DEMO_MODE` | Mission phase at startup | Telemetry |
|-----------------|-------------------------|-----------|
| `true` (default) | `EGRESS` | Live from Java when `EVA_LIVE_TELEMETRY=true`; mock when `false` |
| `false` | `INIT` | Live from Java or training snapshot when live mode off |

Tests call `seed_training()` and `set_phase(INIT)` in `conftest.py` so they do not depend on demo defaults.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -c "import uvicorn; print('uvicorn OK')"
```

**Rule of thumb:** always use `python -m pip install …`, not bare `pip install …`, so packages go into the **same** interpreter that runs `run_aia.py`. With **Conda** active, bare `pip` can target a different Python than `python` in the venv.

Confirm the interpreter (after `source .venv/bin/activate`):

```bash
which python
# Expect: .../SUITS-26/backend/.venv/bin/python
```

If `which python` still points at **miniconda** (or anything other than `backend/.venv/bin/python`), recreate the venv:

```bash
cd backend
deactivate 2>/dev/null; conda deactivate 2>/dev/null
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -c "import uvicorn; print('uvicorn OK')"
```

## Run

**Recommended** — configure AIA bind address and Java hub IP/port on the command line:

```bash
python run_aia.py --reload --host 0.0.0.0 --port 8000 --java-host 127.0.0.1 --java-port 7071
```

If `uvicorn` is missing, `run_aia.py` prints a hint. Typical fix (venv active):

```bash
which python
python -m pip install -r requirements.txt
python -c "import uvicorn; print('ok')"
python run_aia.py --reload --host 0.0.0.0 --port 8000 --java-host 127.0.0.1 --java-port 7071
```

Other examples:

```bash
# Java on another machine
python run_aia.py --java-host 192.0.0.2 --java-port 7071

# Full Java URL override
python run_aia.py --java-url http://192.168.1.10:7071

# HTTP poll instead of mission WebSocket
python run_aia.py --java-host 127.0.0.1 --java-port 7071 --java-transport http
```

Equivalent env vars (used by `run_aia.py` or plain uvicorn): `EVA_JAVA_HOST`, `EVA_JAVA_PORT`, `EVA_JAVA_BACKEND_URL`, `EVA_BIND_HOST`, `EVA_BIND_PORT`.

Plain uvicorn (settings from `backend/.env` only):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **OpenAPI**: `http://localhost:8000/docs`
- **Health**: `GET /health`

### Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/command` | Natural-language command; returns `success`, `error_code`, `response_text`, etc. |
| `GET` | `/telemetry` | 7-field suit summary (derived from Java bundle) |
| `GET` | `/telemetry/full` | Full raw Java mission telemetry bundle (EV1/EV2, DCU, rover, LTV, etc.) |
| `GET` | `/telemetry/warnings` | Derived warnings from summary + raw bundle |
| `POST` | `/telemetry/update` | Partial update (disabled when live telemetry is on) |
| `GET` | `/mission` | Current phase |
| `POST` | `/mission/phase` | Set phase |
| `GET` | `/procedure/list` | Loaded procedures |
| `GET` | `/procedure/current` | Active procedure state |
| `POST` | `/procedure/start` | Start by `procedure_id` |
| `POST` | `/procedure/next` | Next step |
| `POST` | `/procedure/repeat` | Repeat step |
| `POST` | `/asr/transcribe` | Multipart: `audio` file + `auto_route_to_command` — local Whisper → normalize → optional same pipeline as `/command` |
| `GET` | `/agent/status` | `agentic_enabled`, `live_telemetry_enabled`, `java_backend_reachable` |
| `GET` | `/agent/alerts` | Recent threshold alerts with LLM-phrased `spoken_text` |

CORS allows the Vite dev server on **5173** by default.

### ASR

- **Dependency:** `faster-whisper` (see root `requirements.txt`). **ffmpeg** should be on `PATH` for WebM/MP3 from browsers.
- **Env:** `EVA_ASR_ENABLED`, `EVA_ASR_MODEL_SIZE`, `EVA_ASR_DEVICE`, `EVA_ASR_COMPUTE_TYPE` (see main README).
- Raw transcripts are **never** parsed directly; `command_normalizer` maps EVA phrasing, then `parse_command` runs on the normalized string.

## Tests

```bash
pytest
```

From the `backend` directory with the virtualenv activated.

## Configuration

Environment variables (prefix **`EVA_`**):

| Variable | Description |
|----------|-------------|
| `EVA_DEMO_MODE` | `true` / `false` — demo vs training startup defaults |
| `EVA_CORS_ORIGINS` | JSON array of allowed browser origins |
| `EVA_ASR_ENABLED` | `true` / `false` — enable local Whisper endpoint |
| `EVA_ASR_MODEL_SIZE` | Whisper model id (default `base`) |
| `EVA_ASR_DEVICE` | `cpu` or `cuda` |
| `EVA_ASR_COMPUTE_TYPE` | e.g. `int8`, `float16` |
| `EVA_AGENTIC_ENABLED` | `true` / `false` — LLM router + alert phrasing (Ollama) |
| `EVA_OLLAMA_BASE_URL` | Ollama base URL (default `http://127.0.0.1:11434`) |
| `EVA_OLLAMA_MODEL` | Model id (default `llama3.2`) |
| `EVA_LIVE_TELEMETRY` | `true` / `false` — live Java telemetry for commands (default `true`) |
| `EVA_JAVA_TELEMETRY_TRANSPORT` | `websocket` (default) or `http` — mission WS vs REST poll |
| `EVA_JAVA_BACKEND_URL` | Java API base URL (default `http://localhost:7070`); must match your `JAVA_HTTP_PORT` |
| `EVA_JAVA_BACKEND_WS_URL` | Optional override for `ws://…/telemetry/mission/live` |
| `EVA_LIVE_TELEMETRY_POLL_INTERVAL_S` | HTTP poll interval when transport is `http` (default `1.0`) |
| `EVA_JAVA_HTTP_TIMEOUT_S` | Per-request HTTP timeout when transport is `http` (default `2.0`) |

## Mission phases

`INIT`, `PR_SEARCH`, `EGRESS`, `EVA_NAV`, `LTV_REPAIR`, `INGRESS`, `COMPLETE`

# Backend — EVA AIA API

FastAPI service: `POST /command`, in-memory **mission**, **telemetry**, **procedures** (YAML), **warnings**, and **guardrails**. No database. Optional **agentic** path uses a local **Ollama** LLM (see root README).

## Demo mode and defaults

| `EVA_DEMO_MODE` | Mission phase at startup | Telemetry |
|-----------------|-------------------------|-----------|
| `true` (default) | `EGRESS` | `DEMO_TELEMETRY` — realistic mock readouts (`demo_seed.py`) |
| `false` | `INIT` | Training snapshot (used by tests as well) |

Tests call `seed_training()` and `set_phase(INIT)` in `conftest.py` so they do not depend on demo defaults.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **OpenAPI**: `http://localhost:8000/docs`
- **Health**: `GET /health`

### Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/command` | Natural-language command; returns `success`, `error_code`, `response_text`, etc. |
| `GET` | `/telemetry` | Full mock snapshot |
| `GET` | `/telemetry/warnings` | Derived warnings from thresholds |
| `POST` | `/telemetry/update` | Partial telemetry update |
| `GET` | `/mission` | Current phase |
| `POST` | `/mission/phase` | Set phase |
| `GET` | `/procedure/list` | Loaded procedures |
| `GET` | `/procedure/current` | Active procedure state |
| `POST` | `/procedure/start` | Start by `procedure_id` |
| `POST` | `/procedure/next` | Next step |
| `POST` | `/procedure/repeat` | Repeat step |
| `POST` | `/asr/transcribe` | Multipart: `audio` file + `auto_route_to_command` — local Whisper → normalize → optional same pipeline as `/command` |
| `GET` | `/agent/status` | `agentic_enabled`, `telemetry_json_poll` |
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
| `EVA_TELEMETRY_JSON_PATH` | Optional path to polled telemetry JSON |

## Mission phases

`INIT`, `PR_SEARCH`, `EGRESS`, `EVA_NAV`, `LTV_REPAIR`, `INGRESS`, `COMPLETE`

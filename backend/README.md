# Backend — EVA AIA API

FastAPI service: deterministic `POST /command`, in-memory **mission**, **telemetry**, **procedures** (YAML), **warnings**, and **guardrails**. No database, no LLM.

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

CORS allows the Vite dev server on **5173** by default.

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

## Mission phases

`INIT`, `PR_SEARCH`, `EGRESS`, `EVA_NAV`, `LTV_REPAIR`, `INGRESS`, `COMPLETE`

# EVA AIA — AI Assistant (demo prototype)

Safety-oriented, **deterministic** EVA copilot: rule-based commands, mock telemetry, YAML procedures, guardrails, and a React mission console. **No LLM** in the MVP.

## Overview

- **Backend**: FastAPI, Pydantic, in-memory mission/telemetry/procedure state, YAML procedures under `backend/data/procedures/`.
- **Frontend**: Vite + React + TypeScript, panels for command, assistant reply, mission phase, telemetry, procedures, and alerts.
- **Demo mode** (default): starts in **`EGRESS`** with realistic mock suit telemetry so you can run the egress procedure without manual setup. Set `EVA_DEMO_MODE=false` for a neutral **INIT** + training telemetry baseline (e.g. automated tests).

## Architecture (high level)

```
┌─────────────┐     POST /command      ┌──────────────────────────────────────┐
│   Browser   │ ─────────────────────► │ FastAPI                               │
│  (React UI) │ ◄───────────────────── │  parse → safety → execute response    │
└─────────────┘     JSON responses     │  telemetry / mission / procedure APIs │
                                       └──────────────────────────────────────┘
                                                     │
                                        in-memory state (no DB)
```

Notable modules:

| Area | Path |
|------|------|
| Command parser | `backend/app/services/command_parser.py` |
| Guardrails | `backend/app/services/safety_service.py` |
| Responses | `backend/app/services/response_service.py`, `response_generation.py` |
| Warnings from telemetry | `backend/app/services/warning_evaluation.py` |
| Procedures (YAML) | `backend/app/services/procedure_service.py` |
| Demo vs training defaults | `backend/app/core/demo_seed.py`, `EVA_DEMO_MODE` |

## Setup

### Prerequisites

- Python **3.11+** recommended (3.9+ generally works)
- Node **18+** with npm

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Run the demo

**Terminal 1 — API**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — UI**

```bash
cd frontend
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). With default **demo mode**, mission phase is **EGRESS** and telemetry matches `DEMO_TELEMETRY` in `demo_seed.py`.

### Disable demo defaults (optional)

```bash
export EVA_DEMO_MODE=false
uvicorn app.main:app --reload --port 8000
```

Restart the API after changing env vars.

## Run tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Tests reset mission to **INIT** and telemetry to the **training** snapshot so results stay stable regardless of `EVA_DEMO_MODE`.

### Frontend production build

```bash
cd frontend
npm run build
```

## Example demo flow (voice / text)

Use the **Command** panel with the backend running. Suggested sequence:

1. **Check oxygen** — `oxygen status` (or `what is my oxygen`).
2. **Start egress** — `start egress` (demo phase is already **EGRESS**; `EGRESS_UIA` should start).
3. **Advance** — `next step` (repeat until complete or as needed).
4. **Switch phase** — In **Mission status**, set **LTV_REPAIR**, then **Set phase**.
5. **Start ERM** — `start erm` or `start repair` (procedure `ERM_REPAIR`).
6. **Run diagnosis** — `run diagnosis` (stub result depends on **LTV** field in telemetry).
7. **Check warnings** — `any warnings` (or watch the **Alerts** panel).
8. **Return guidance** — Set phase to **EVA_NAV** or **INGRESS**, then `guide me back` or `return route`.

Adjust telemetry in the **Telemetry** panel (e.g. lower O₂ %) to see **Alerts** update after refresh.

## Screenshots (optional)

For slides or documentation, capture the mission console UI and place files under [`docs/screenshots/`](docs/screenshots/README.md). Suggested names are listed there.

## Repository layout

```
backend/          # FastAPI app, procedures, tests
frontend/         # Vite React UI
docs/screenshots/ # Screenshot placeholders / instructions
```

More detail:

- [`backend/README.md`](backend/README.md) — API endpoints and env vars
- [`frontend/README.md`](frontend/README.md) — dev server and `VITE_API_ORIGIN`

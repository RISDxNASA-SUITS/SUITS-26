# SUITS-26

RISD × NASA SUITS 2026 monorepo: the **official NASA telemetry stack** (TSS, Java, Python navigation) plus the team **EVA voice assistant** (FastAPI + React).

## Project structure

| Path | Purpose |
|------|---------|
| [TSS](./TSS/README.md) | Telemetry Stream Server (C) — rover, EVA, LTV data; DUST simulator UDP |
| [JavaBackend](./JavaBackend/README.md) | Kotlin/Javalin REST API over TSS (POIs, rover control, EVA/LTV reads) |
| [PythonBackend](./PythonBackend/README.md) | Flask robust rover navigation over the Java backend |
| [backend](./backend/README.md) | FastAPI EVA mission assistant (commands, procedures, ASR, optional Ollama) |
| [frontend](./frontend/README.md) | React mission console for the EVA assistant |
| [docs/EVA_README.md](./docs/EVA_README.md) | Full EVA assistant documentation (architecture, config, troubleshooting) |
| [system.md](./system.md) | ASCII EVA pipeline diagram |

## Quick start — NASA stack (TSS + Java + Python)

```bash
docker compose -f docker-compose.yaml up -d --build
```

| Service | Port | URL |
|---------|------|-----|
| TSS (`c-backend`) | 14141 TCP/UDP | http://localhost:14141 |
| Java backend | 7070 | http://localhost:7070 |
| Python navigation | 4000 | http://localhost:4000 |

Stop: `docker compose -f docker-compose.yaml down`

API docs: [JavaBackend/README.md](./JavaBackend/README.md), [PythonBackend/README.md](./PythonBackend/README.md), [TSS/README.md](./TSS/README.md)

## Quick start — EVA voice assistant

**Dev (two terminals):**

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 (API at http://localhost:8000).

**Docker (single container, API + built UI):**

```bash
docker compose -f docker-compose.yml up --build
```

Open http://localhost:8000

Copy `backend/.env.example` or see [docs/EVA_README.md](./docs/EVA_README.md) for `EVA_*` settings (demo mode, ASR, optional Ollama agentic mode).

## Notes

- Use `docker-compose.yaml` for the NASA reference stack and `docker-compose.yml` for the EVA assistant image.
- `TSS/` is the in-repo TSS copy; `TSS2026/` may exist as a separate NASA upstream clone — prefer `TSS/` for docker and team changes.
- Optional: point the EVA backend at live telemetry via `EVA_TELEMETRY_JSON_PATH` (poll a JSON file written from TSS/Java).

## Live demo

EVA assistant: https://nasa-voice-ai-assistant.onrender.com

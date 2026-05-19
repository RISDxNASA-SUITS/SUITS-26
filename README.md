# SUITS-26

RISD × NASA SUITS 2026 monorepo: the **official NASA telemetry stack** (TSS, Java, Python navigation) plus the team **EVA voice assistant** (FastAPI + React).

**New here?** See **[RUN.md](./RUN.md)** for a short setup guide (Docker, EVA UI, voice, Ollama).

## Project structure

| Path | Purpose |
|------|---------|
| [TSS](./TSS/README.md) | Telemetry Stream Server (C) — rover, EVA, LTV data; DUST simulator UDP |
| [JavaBackend](./JavaBackend/README.md) | Kotlin/Javalin REST API over TSS (POIs, rover control, EVA/LTV reads) |
| [PythonBackend](./PythonBackend/README.md) | Flask robust rover navigation over the Java backend |
| [backend](./backend/README.md) | FastAPI EVA mission assistant (commands, procedures, ASR, optional Ollama) |
| [frontend](./frontend/README.md) | React mission console for the EVA assistant |
| [docs/EVA_README.md](./docs/EVA_README.md) | Full EVA assistant documentation (architecture, config, troubleshooting) |
| [docs/AIA-STANDALONE.md](./docs/AIA-STANDALONE.md) | **Run AIA** — Mode 1: Docker · Mode 2: no Docker + local Ollama |
| [system.md](./system.md) | ASCII EVA pipeline diagram |

## Prerequisites

| Tool | Used for |
|------|----------|
| [Docker](https://docs.docker.com/get-docker/) + Docker Compose | TSS, Java, Ollama, Python nav, EVA API (recommended) |
| Python 3.11+ | EVA backend local dev |
| Node.js 20.19+ or 22.12+ | EVA frontend (`npm`) |
| ffmpeg | Browser voice input when EVA runs **locally** (`brew install ffmpeg`) |
| GCC (macOS/Linux) | Building TSS natively outside Docker |

**Ollama:** included in `docker-compose.yaml` for agentic commands (natural language). Install the [Ollama app](https://ollama.com) only if you run the EVA API on the host with `EVA_AGENTIC_ENABLED=true`.

## Ports and URLs

| Service | Port | URL |
|---------|------|-----|
| TSS (`c-backend`) | 14141 TCP/UDP | http://localhost:14141 |
| Java backend | 7070 | http://localhost:7070 |
| Python navigation | 4000 | http://localhost:4000 |
| EVA API | 8000 | http://localhost:8000 |
| EVA frontend (Vite dev) | 5173 | http://localhost:5173 |
| Ollama (`ollama`) | 11434 | http://localhost:11434 |

In Compose, `eva-backend` calls `http://ollama:11434` on the Docker network. Service `ollama-init` pulls `llama3.2` before EVA starts (first run may take several minutes). Model weights persist in the `ollama_data` volume.

---

## Run everything (recommended)

### Option A — Full stack in Docker (TSS + Java + Ollama + EVA API)

Starts TSS, Java, Ollama (with model pull), EVA API, and Python navigation. Live telemetry and **agentic** voice/text commands are enabled in the container env.

```bash
# From repo root — first start downloads llama3.2 via ollama-init
docker compose -f docker-compose.yaml up -d --build
```

**EVA + telemetry + Ollama only** (no Python navigation):

```bash
docker compose -f docker-compose.yaml up -d --build c-backend java-backend ollama eva-backend
```

**TSS + Java only** (no EVA/Ollama — use with local `uvicorn`):

```bash
docker compose -f docker-compose.yaml up -d --build c-backend java-backend
```

**Add rover navigation** (after Java is up):

```bash
docker compose -f docker-compose.yaml up -d --build python-backend
```

Verify:

```bash
docker compose -f docker-compose.yaml ps
curl -s http://localhost:14141/ | head -3          # TSS web UI
curl -s http://localhost:7070/ev-telemetry/1 | head -c 120
curl -s http://localhost:11434/api/tags            # Ollama
curl -s http://localhost:8000/agent/status         # agentic_enabled, java_backend_reachable
```

View logs:

```bash
docker compose -f docker-compose.yaml logs -f ollama ollama-init java-backend eva-backend
```

Stop and remove containers (keeps `ollama_data` volume):

```bash
docker compose -f docker-compose.yaml down
```

Then run the **frontend** locally (not in compose yet):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the UI talks to the EVA API at http://localhost:8000. Open http://localhost:14141 for the **TSS** control panel.

### Option B — Local dev (best for frontend + EVA work)

Full detail: **[docs/AIA-STANDALONE.md](./docs/AIA-STANDALONE.md)** (Mode 2 — no Docker for AIA).

**Terminal 1 — Java Hub (TSS + Java)**

*If Java Hub runs on this Mac via Docker:*

```bash
docker compose -f docker-compose.yaml up -d --build c-backend java-backend
curl -s http://127.0.0.1:7070/ev-telemetry/1 | head -c 80
```

*If Java Hub runs on another machine (competition / teammate’s laptop):* skip Terminal 1 here — note that machine’s **IP address** (e.g. `192.168.1.20`). You will pass it to `aia-start.sh` in Terminal 2.

**Terminal 2 — AIA (no Docker)** — from **repo root**

Install [Ollama](https://ollama.com), run `ollama pull llama3.2`, then:

```bash
cp backend/.env.competition backend/.env

# JAVA_IP = IP of the machine running Java Hub (7070)
# Local Docker Hub on this Mac:
./scripts/aia-start.sh 127.0.0.1

# Java Hub on another computer:
./scripts/aia-start.sh 192.168.1.20

# Foreground / stop / help
./scripts/aia-start.sh 192.168.1.20 --foreground
./scripts/aia-stop.sh
./scripts/aia-start.sh --help
```

The script writes `EVA_JAVA_BACKEND_URL`, checks Hub reachability, and starts AIA on port `8000`. Logs: `backend/.run/aia.log`.

Do **not** run `docker compose ... eva-backend` at the same time (same port `8000`).

**Terminal 3 — EVA frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Verify Java is reachable before expecting live telemetry:**

```bash
curl -s http://localhost:7070/ev-telemetry/1 | head -c 200
curl -s http://localhost:8000/health
curl -s http://localhost:8000/telemetry
```

If `GET /telemetry` returns **503**, TSS/Java is not up yet or `EVA_JAVA_BACKEND_URL` is wrong. See [Troubleshooting](#troubleshooting).

### Option C — EVA API + UI only (mock telemetry, no TSS)

Useful for UI, commands, and procedures without the NASA stack.

```bash
cd backend
source .venv/bin/activate
EVA_LIVE_TELEMETRY=false uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm run dev
```

Or set `EVA_LIVE_TELEMETRY=false` in `backend/.env`.

### Option D — EVA single-container Docker (API + built UI)

```bash
docker compose -f docker-compose.yml up --build
```

Open http://localhost:8000 (no separate Vite dev server). For live TSS data, still run TSS + Java via `docker-compose.yaml` and point the container at them (see [docs/EVA_README.md](./docs/EVA_README.md)).

---

## Run individual services

### TSS (native, outside Docker)

```bash
cd TSS
chmod +x ./build.bat
./build.bat
./server.exe
```

Open the URL printed at startup (e.g. `http://<your-ip>:14141`). See [TSS/README.md](./TSS/README.md) for DUST connection and UDP commands.

### Java backend (local Maven, if not using Docker)

Requires TSS on `14141`:

```bash
cd JavaBackend
export TSS_HOST=127.0.0.1
export TSS_UDP_PORT=14141
# Build/run per JavaBackend/README.md
```

### Python navigation

With Java on port 7070:

```bash
cd PythonBackend
export JAVA_BACKEND_URL=http://localhost:7070
poetry install
poetry run python python_server/api.py
```

Debug UIs: http://localhost:4000/navigation_vis_robust , http://localhost:4000/lidar_vis

Start a navigation goal:

```bash
curl -X POST http://localhost:4000/navigate_robust \
  -H "Content-Type: application/json" \
  -d '{"x": -5692.0, "y": -10048.0}'
```

---

## Data flow (EVA UI)

```text
                    ┌── Ollama :11434 (agentic commands + alerts)
                    │   HTTP /api/chat
DUST / TSS ──UDP──► Java :7070 ──HTTP poll──► EVA API :8000 ──HTTP──► React :5173
  :14141              :7070                      :8000              :5173
  (TSS UI)                                    GET /telemetry
                                              POST /command
```

- **Telemetry:** EVA polls Java every second when `EVA_LIVE_TELEMETRY=true`. The frontend never calls Java or TSS directly.
- **Commands:** With `EVA_AGENTIC_ENABLED=true`, EVA routes utterances through Ollama, then answers using the in-memory telemetry snapshot (and optional navigation demo).
- **Voice:** Browser → `POST /asr/transcribe` (Whisper in EVA) → same command pipeline as text.

---

## Configuration

### Docker (`eva-backend` in `docker-compose.yaml`)

These are set in Compose (override in the `environment:` block if needed):

| Variable | Compose value | Purpose |
|----------|---------------|---------|
| `EVA_JAVA_BACKEND_URL` | `http://java-backend:7070` | Java on Docker network |
| `EVA_OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama on Docker network |
| `EVA_AGENTIC_ENABLED` | `true` | Natural-language commands |
| `EVA_OLLAMA_MODEL` | `llama3.2` | Pulled by `ollama-init` |
| `EVA_LIVE_TELEMETRY` | `true` | Live suit data from Java/TSS |

### Local (`backend/.env`)

Copy and edit [`backend/.env`](backend/.env) when running `uvicorn` on the host:

| Variable | Typical local value | Purpose |
|----------|---------------------|---------|
| `EVA_LIVE_TELEMETRY` | `true` | Poll Java at `localhost:7070` |
| `EVA_JAVA_BACKEND_URL` | `http://localhost:7070` | Java API |
| `EVA_DEMO_MODE` | `true` | Mission starts in `EGRESS` |
| `EVA_CORS_ORIGINS` | `5173`, `127.0.0.1` | Browser origins |
| `EVA_ASR_ENABLED` | `true` | Whisper voice input (needs ffmpeg) |
| `EVA_AGENTIC_ENABLED` | `true` / `false` | `true` → needs Ollama |
| `EVA_OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Host Ollama or published Docker port |
| `EVA_OLLAMA_MODEL` | `llama3.2` | `ollama pull llama3.2` |

**Commands without Ollama:** set `EVA_AGENTIC_ENABLED=false` and use exact phrases (`battery status`, `oxygen status`, `help`, …). See [RUN.md](./RUN.md).

Full list: [backend/README.md](./backend/README.md), [docs/EVA_README.md](./docs/EVA_README.md).

Frontend override (only if API is on another host):

```bash
VITE_API_ORIGIN=http://localhost:8000 npm run dev
```

---

## Tests

**EVA backend** (from `backend/`, venv active):

```bash
pytest
```

**EVA frontend** (from `frontend/`):

```bash
npm run build
npm run lint
```

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| `GET /telemetry` → 503 | Java/TSS not running or wrong `EVA_JAVA_BACKEND_URL`. `curl http://localhost:7070/ev-telemetry/1`. |
| `LLM_UNAVAILABLE` / language model errors | Ollama not up: `docker compose logs ollama ollama-init` or start host Ollama + `ollama pull llama3.2`. `curl http://localhost:11434/api/tags`. |
| `UNKNOWN_COMMAND` | Rule-based mode (`EVA_AGENTIC_ENABLED=false`) — use exact phrases like `battery status`, not free-form questions. |
| EVA container won’t start | Wait for `ollama-init` to finish pulling `llama3.2` (`docker compose ps -a`). |
| CORS errors in browser | Add your dev origin to `EVA_CORS_ORIGINS`. |
| Voice input fails (local EVA) | Install ffmpeg; first transcribe downloads Whisper weights. |
| Voice input fails (Docker EVA) | ASR runs inside the image; check `docker compose logs eva-backend`. |
| Telemetry stuck / mock values | `EVA_LIVE_TELEMETRY=false` or Java poll failing — `GET http://localhost:8000/agent/status`. |
| TSS UI won’t load | Open http://localhost:14141; `docker compose logs c-backend`. |
| Docker build fails on EVA image | Build from repo root; root `Dockerfile` required. |
| Node / Vite errors | Node **20.19+** or **22.12+** (`frontend/package.json` engines). |

---

## Compose files

| File | Services |
|------|----------|
| [`docker-compose.yaml`](docker-compose.yaml) | `c-backend`, `java-backend`, `python-backend`, `ollama`, `ollama-init`, `eva-backend` |
| [`docker-compose.yml`](docker-compose.yml) | Standalone EVA image (API + static UI; wire Ollama/TSS separately) |

| Volume | Purpose |
|--------|---------|
| `ollama_data` | Persisted Ollama models (`llama3.2`, etc.) |

Prefer `TSS/` in this repo for team changes; `TSS2026/` may exist as a separate NASA upstream clone.

---

## API documentation

- Java: [JavaBackend/README.md](./JavaBackend/README.md)
- Python navigation: [PythonBackend/README.md](./PythonBackend/README.md)
- TSS: [TSS/README.md](./TSS/README.md)
- EVA: http://localhost:8000/docs (when API is running)

---

## Live demo

EVA assistant: https://nasa-voice-ai-assistant.onrender.com

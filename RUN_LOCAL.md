# Run SUITS-26 locally (no Docker)

Start **TSS**, **Java hub**, **AIA (EVA API)**, and the **frontend** in **four separate terminals**. Optional **fifth terminal** for Ollama if you use agentic (natural-language) mode.

No Docker required. Do not run `docker compose` for TSS/Java while native `./server.exe` is running — both need UDP port **14141**.

---

## What you get

| URL | Service |
|-----|---------|
| http://localhost:14141 | TSS control panel (NASA sim) |
| http://localhost:7071 | Java hub REST + WebSocket (port may be **7070** if free) |
| http://localhost:8000 | AIA / EVA API (`/docs` for OpenAPI) |
| http://localhost:5173 | Mission console (React) |
| http://127.0.0.1:11434 | Ollama (optional, agentic mode) |

---

## Install once

```bash
# macOS
xcode-select --install          # gcc for TSS
brew install maven ffmpeg       # Java backend + voice (ASR)

# Check
gcc --version
mvn -version
java -version
node -v                         # Node 20.19+ or 22.12+
python3 --version                 # 3.11+
```

**AIA backend (one time):**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Frontend (one time):**

```bash
cd frontend
npm install
```

**Agentic mode (optional, one time):**

- Install [Ollama](https://ollama.com)
- `ollama pull llama3.2`

---

## Port cheat sheet

| Service | Default port | Notes |
|---------|--------------|--------|
| TSS HTTP + UDP | **14141** | `./server.exe` |
| Java hub | **7070** or **7071** | Use **7071** when 7070 is busy |
| AIA API | **8000** | `run_aia.py --port` |
| Frontend (Vite) | **5173** | `npm run dev` |
| Ollama | **11434** | Agentic LLM |

**Important:** `JAVA_HTTP_PORT`, `run_aia.py --java-port`, and `frontend/.env.development` → `VITE_HUB_PROXY_TARGET` must all use the **same Java port**.

---

## Terminal 1 — TSS

```bash
cd TSS
chmod +x ./build.bat
./build.bat
./server.exe
```

Leave running. In the log, note the line:

```text
Launching Server at IP: <your-ip>:14141
```

Open http://localhost:14141

**If Java runs on another machine**, use that IP as `TSS_HOST` in Terminal 2 (not `ip:port` — port goes in `TSS_UDP_PORT` only).

---

## Terminal 2 — Java hub

From repo root:

```bash
cd JavaBackend
```

**Same machine as TSS** (typical):

```bash
JAVA_HTTP_PORT=7071 TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

**TSS on another host** (use the IP from Terminal 1, no port in `TSS_HOST`):

```bash
JAVA_HTTP_PORT=7071 TSS_HOST=192.0.0.2 TSS_UDP_PORT=14141 mvn exec:java
```

If **7070** is free, you can omit `JAVA_HTTP_PORT=7071` (defaults to 7070).

Wait for:

```text
HTTP server listening on port 7071
```

**Verify** (new shell, adjust port if needed):

```bash
curl -s http://localhost:7071/telemetry | head -c 120
curl -s http://localhost:7071/ev-telemetry/1 | head -c 120
```

**Mission WebSocket** (AIA full telemetry):

```bash
cd JavaBackend
python3 test_mission_telemetry_ws.py --host 127.0.0.1 --port 7071 --count 1
```

If you see `404 WebSocket handler not found`, stop Java and restart after `mvn compile exec:java` so the latest code (mission WS) is running.

---

## Terminal 3 — Ollama (optional, agentic mode)

Skip this terminal if `EVA_AGENTIC_ENABLED=false` and you only use exact voice/text phrases.

```bash
ollama serve
# or start the Ollama app from the menu bar

ollama pull llama3.2   # once
```

Check:

```bash
curl -s http://127.0.0.1:11434/api/tags
```

---

## Terminal 4 — AIA (EVA backend)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -c "import uvicorn; print('uvicorn OK')"
```

**Recommended** — set Java IP and port on the command line (match Terminal 2):

```bash
python run_aia.py --reload --host 0.0.0.0 --port 8000 \
  --java-host 127.0.0.1 --java-port 7071
```

Always use **`python -m pip`** (not bare `pip`) after activating the venv so packages install into the **same** interpreter that runs `run_aia.py` (Conda and bare `pip` can disagree).

Examples:

```bash
# Java on 7070
python run_aia.py --reload --java-host 127.0.0.1 --java-port 7070

# TSS/Java on another machine IP
python run_aia.py --reload --java-host 192.0.0.2 --java-port 7071

# REST poll instead of mission WebSocket (fallback)
python run_aia.py --reload --java-host 127.0.0.1 --java-port 7071 --java-transport http
```

Startup prints resolved URLs. Open http://localhost:8000/docs

**Verify:**

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/agent/status
```

Expect:

```json
{
  "agentic_enabled": true,
  "live_telemetry_enabled": true,
  "java_backend_reachable": true
}
```

```bash
curl -s http://localhost:8000/telemetry/full | head -c 200
```

If `java_backend_reachable` is **false**, fix Java port/host or restart Java (Terminal 2).

**Agentic settings** can live in `backend/.env`:

```env
EVA_AGENTIC_ENABLED=true
EVA_OLLAMA_BASE_URL=http://127.0.0.1:11434
EVA_OLLAMA_MODEL=llama3.2
EVA_LIVE_TELEMETRY=true
```

---

## Terminal 5 — Frontend

Ensure hub proxy matches Java (edit once if needed):

`frontend/.env.development`:

```env
VITE_HUB_PROXY_TARGET=http://127.0.0.1:7071
```

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

The UI talks to:

- **AIA** at http://localhost:8000 (commands, voice, alerts)
- **Java hub** via Vite proxy `/hub` → live map/rover WebSocket

---

## Startup order

```text
1. TSS          (Terminal 1)  — telemetry source
2. Java         (Terminal 2)  — reads TSS, exposes REST + WS
3. Ollama       (Terminal 3)  — optional, agentic only
4. AIA          (Terminal 4)  — connects to Java mission WS
5. Frontend     (Terminal 5)  — browser UI
```

---

## Quick checklist

- [ ] http://localhost:14141 — TSS UI loads
- [ ] `curl http://localhost:7071/telemetry` — JSON from Java
- [ ] `curl http://localhost:8000/agent/status` — `java_backend_reachable: true`
- [ ] http://localhost:5173 — mission console loads
- [ ] (Agentic) Ask AIA: *“what is my battery level?”* — answer uses live data

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| `ModuleNotFoundError: No module named 'uvicorn'` | See [Python / venv (below)](#python--venv-uvicorn-or-other-import-errors) |
| Docker: `14141 address already in use` | Stop Docker `c-backend` or stop native `./server.exe` — use one TSS only |
| `java_backend_reachable: false` | Match `--java-port` to `JAVA_HTTP_PORT`; restart AIA after Java is up |
| `/telemetry/full` → 503 | Same as above; or use `--java-transport http` until mission WS works |
| Mission WS 404 | Restart Java with `mvn exec:java` after latest code is pulled/built |
| `LLM_UNAVAILABLE` | Start Ollama; `ollama pull llama3.2` |
| Map hub disconnected | Set `VITE_HUB_PROXY_TARGET` to same host:port as Java |
| Voice / ASR fails | `brew install ffmpeg`; check mic permissions |

### Python / venv (`uvicorn` or other import errors)

With the venv activated, `which python` should show your project venv, e.g. `.../SUITS-26/backend/.venv/bin/python`.

```bash
which python
python -m pip install -r requirements.txt
python -c "import uvicorn; print('ok')"
python run_aia.py --reload --host 0.0.0.0 --port 8000 --java-host 127.0.0.1 --java-port 7071
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
python run_aia.py --reload --host 0.0.0.0 --port 8000 --java-host 127.0.0.1 --java-port 7071
```

**Rule of thumb:** use `python -m pip install …`, not plain `pip install …`, so installs target the same interpreter as `python run_aia.py`.

---

## Related docs

- [`RUN_TSS_JAVA_NO_DOCKER.md`](RUN_TSS_JAVA_NO_DOCKER.md) — TSS + Java details and UDP troubleshooting
- [`RUN.md`](RUN.md) — full project guide including Docker options
- [`WEBSOCKET_USAGE.md`](WEBSOCKET_USAGE.md) — Java WebSocket payloads
- [`backend/README.md`](backend/README.md) — AIA API and env vars

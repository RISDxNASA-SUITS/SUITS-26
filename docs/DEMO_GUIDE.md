# EVA AIA — Demo usage guide

This guide is for **presenters and testers**: how to use the mission console in the browser, issue voice or text commands, and inspect telemetry and procedures. For architecture and deployment, see the root [README.md](../README.md).

**Other language:** [中文说明 (DEMO_GUIDE.zh-CN.md)](DEMO_GUIDE.zh-CN.md)

---

## 1. What this demo is

- **EVA-style mission assistant (demo)** — **Rule-based** command parsing (**no LLM**), with **safety guardrails** and mission / telemetry / procedure (YAML) logic.
- **Voice in** — Browser records audio → server **faster-whisper** transcription → normalization → **same pipeline** as typed commands.
- **Voice out** — Browser **Web Speech API** reads assistant replies (toggleable).
- **Data** — Telemetry and mission state are **in-memory demo data**; procedure steps come from `backend/data/procedures/` on the server.

---

## 2. Before you start

| Topic | Notes |
|-------|--------|
| Browser | **Chrome** or **Edge** recommended (better voice + TTS compatibility). |
| Microphone | Grant microphone access for voice input; on the **public internet use HTTPS**, or the browser may block `getUserMedia`. |
| Network | First cloud transcription may **download Whisper weights** — wait for it to finish. |
| Backend | The API must be running (local or Docker). ASR needs **ffmpeg** on the server (included in the Docker image). |

---

## 3. How to open the UI

### 3.1 Local development (split frontend and backend)

1. Start the backend on port **8000** (see [backend/README.md](../backend/README.md)).
2. From the `frontend` folder, run `npm run dev` and open the URL printed in the terminal (usually **http://localhost:5173**).
3. The client defaults to `http://localhost:8000`. If your API uses another host or port, set **`VITE_API_ORIGIN`**.

### 3.2 Local single container (full stack, quick try)

From the **repository root**:

```bash
docker compose up --build
```

Open **http://localhost:8000** (static UI and API share the same origin).

### 3.3 Cloud deployment

Build from the root **Dockerfile** and open the platform’s **HTTPS** URL. See `EVA_CORS_ORIGINS`, memory, and related settings in the **Production deployment** section of [README.md](../README.md).

---

## 4. Mission console layout

The page is a **mission console** with:

- **Header** — Mission title, **Voice output** toggle, demo entry points, etc.
- **Command** — Text field; **Mic** / **Stop** for short voice recordings.
- **Assistant** — Structured replies; for voice, **Transcript** and **Normalized** text when routing succeeds.
- **Mission / Telemetry / Procedure / Alerts** — Current phase, telemetry sliders and refresh, procedure steps, alerts (subject to the live UI).

---

## 5. Basic actions

### 5.1 Text commands

1. Type English phrases the parser supports (status queries, procedure control, etc.) in **Command**.
2. Submit and read the reply in **Assistant**. With **Voice output** on, **successful** replies speak **`response_text`**; guardrail rejections and errors are usually **not** read aloud.

### 5.2 Voice commands

1. Click **Mic**, speak a **short** phrase in a quiet environment.
2. Click **Stop** to finish recording.
3. Check **Assistant** for transcript and normalization; if routing succeeds, behavior matches typed commands.

**Tip** — If transcription is empty or wrong, speak clearly and keep phrases short; you can tune Whisper model size and confidence via environment variables (see README).

### 5.3 Voice output (TTS)

- Turn on **Voice output** in the header (often on by default).
- **Chrome** may require a **click anywhere on the page** before speech plays.
- Check system volume and that the tab is not muted.

---

## 6. Suggested demo flow (demo mode on)

With **demo mode** (default), the phase often starts at **EGRESS** with realistic demo telemetry. Try in order (text or spoken phrases that normalize correctly):

1. **Oxygen** — e.g. `oxygen status`, or a natural phrase that normalizes to the same intent.
2. **Egress procedure** — `start egress`, then `next step` / `repeat step` as needed.
3. **Phase change** — In **Mission status**, pick e.g. **LTV_REPAIR**, then **Set phase**.
4. **ERM** — `start erm` or `start repair`.
5. **Diagnosis** — `run diagnosis` (behavior depends on telemetry / phase; see UI).
6. **Warnings** — `any warnings` or watch the **Alerts** panel.
7. **Return route** — Set phase to **EVA_NAV** or **INGRESS**, then `guide me back` or `return route`.

Adjust **Telemetry** sliders and refresh to see **Alerts** change.

---

## 7. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Mic does nothing | Grant microphone permission; use **HTTPS** on the public web; try Chrome/Edge. |
| ASR returns 503 | ASR disabled or missing deps; set `EVA_ASR_ENABLED=true` and ensure the API is healthy. |
| Transcript but wrong command | Spoken text must normalize to supported phrases; try `help` or see parser / normalizer docs in the repo. |
| No TTS | Enable **Voice output**; click the page once; check mute and volume. |
| CORS errors | Add your frontend origin to `EVA_CORS_ORIGINS` (JSON array string). |

See the Troubleshooting table in [README.md](../README.md) for more.

---

## 8. Related docs

| Doc | Contents |
|-----|----------|
| [README.md](../README.md) | Architecture, env vars, Docker deployment, tests |
| [backend/README.md](../backend/README.md) | API surface, health, mission phases |
| [frontend/README.md](../frontend/README.md) | Build, `VITE_API_ORIGIN`, TTS details |
| [system.md](../system.md) | ASCII pipeline overview (slides / reports) |

---

*This file is maintained with the repository; if the UI diverges, trust the current code and README.*

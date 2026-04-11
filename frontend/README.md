# Frontend — EVA AIA mission console

Vite + React + TypeScript. Single-page **mission console**: command input, prominent assistant reply, mission status, telemetry (with mock patch), procedures, and alerts.

## Prerequisites

**Node.js 20.19+ or 22.12+** (Vite 8). Check with `node -v`. On macOS, install via [nodejs.org](https://nodejs.org), **Homebrew** (`brew install node@22`), or **nvm**: `nvm install 22 && nvm use 22`.

## Setup

```bash
cd frontend
npm install
```

## Run (development)

1. Start the backend on port **8000** (see [`../backend/README.md`](../backend/README.md)).
2. From this directory:

```bash
npm run dev
```

Open the printed URL (typically `http://localhost:5173`).

### API origin

In **development**, the client calls `http://localhost:8000` by default. To override:

```bash
VITE_API_ORIGIN=http://127.0.0.1:8000 npm run dev
```

In a **production build** served from the Docker image (same host as the API), the client uses `window.location.origin` unless `VITE_API_ORIGIN` is set at build time.

## Build

```bash
npm run build
npm run preview   # optional local preview of production build
```

## Layout

- **Primary column**: Command + Assistant (latest reply emphasized).
- **Side column**: Mission status → Alerts → Telemetry → Procedure.

Responsive: stacks vertically on narrow viewports.

## Voice output (TTS)

- **Voice output** checkbox in the page header (default **on**): speaks the assistant **response text** when the command succeeds (browser **Web Speech API** / `speechSynthesis`).
- Implementation: [`src/utils/tts.ts`](src/utils/tts.ts) — `speak()`, `stop()`, `prepareTextForSpeech()` (Unicode subscripts → ASCII for reliable speech).
- Does **not** read transcripts, normalized text, or guardrail-only errors; no backend change required.

## Tests

Frontend has no Jest/RTL suite in this prototype; backend `pytest` covers API contracts. Run `npm run build` to verify TypeScript and Vite production build.

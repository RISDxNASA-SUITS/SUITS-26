import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api.routes_agent import router as agent_router
from app.api.routes_asr import router as asr_router
from app.api.routes_command import router as command_router
from app.api.routes_mission import router as mission_router
from app.api.routes_procedure import router as procedure_router
from app.api.routes_telemetry import router as telemetry_router
from app.core.config import settings
from app.services.alert_service import start_alert_monitor_thread
from app.services.java_telemetry_poller import start_java_telemetry_listener_thread
from app.services.warning_edge_service import start_warning_edge_monitor_thread


@asynccontextmanager
async def lifespan(app: FastAPI):
    stop = threading.Event()
    threads: list[threading.Thread] = []
    t_poll = start_java_telemetry_listener_thread(stop)
    if t_poll is not None:
        threads.append(t_poll)
    threads.append(start_warning_edge_monitor_thread(stop))
    t_alert = start_alert_monitor_thread(stop)
    if t_alert is not None:
        threads.append(t_alert)
    yield
    stop.set()
    for t in threads:
        t.join(timeout=3.0)


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(command_router)
app.include_router(agent_router)
app.include_router(asr_router)
app.include_router(telemetry_router)
app.include_router(mission_router)
app.include_router(procedure_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _frontend_dist_dir() -> Path | None:
    """Built Vite output: backend/static when deployed (see Dockerfile)."""
    override = os.environ.get("EVA_STATIC_DIR")
    if override:
        p = Path(override)
        return p if p.is_dir() else None
    candidate = Path(__file__).resolve().parent.parent / "static"
    return candidate if candidate.is_dir() else None


def _safe_file_under_dist(dist: Path, full_path: str) -> Path | None:
    """Return path to a file inside dist, or None if unsafe / not a file."""
    rel = full_path.lstrip("/")
    if not rel or ".." in rel.split("/"):
        return None
    try:
        resolved = (dist / rel).resolve()
        resolved.relative_to(dist.resolve())
    except ValueError:
        return None
    return resolved if resolved.is_file() else None


_dist = _frontend_dist_dir()
if _dist is not None:

    @app.get("/")
    async def serve_spa_index() -> FileResponse:
        return FileResponse(_dist / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa_assets(full_path: str) -> FileResponse:
        f = _safe_file_under_dist(_dist, full_path)
        if f is not None:
            return FileResponse(f)
        return FileResponse(_dist / "index.html")

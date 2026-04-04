from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_command import router as command_router
from app.api.routes_mission import router as mission_router
from app.api.routes_procedure import router as procedure_router
from app.api.routes_telemetry import router as telemetry_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(command_router)
app.include_router(telemetry_router)
app.include_router(mission_router)
app.include_router(procedure_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

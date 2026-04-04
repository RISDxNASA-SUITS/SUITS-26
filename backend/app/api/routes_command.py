from fastapi import APIRouter

from app.models.command import CommandRequest
from app.models.response import CommandResponse
from app.services.command_dispatch import run_command_pipeline

router = APIRouter(tags=["command"])


@router.post("/command", response_model=CommandResponse)
def post_command(body: CommandRequest) -> CommandResponse:
    return run_command_pipeline(body.text)

from fastapi import APIRouter

from app.models.command import CommandRequest
from app.models.response import CommandResponse
from app.services.command_parser import parse_command
from app.services.response_service import execute_command_response
from app.services import safety_service

router = APIRouter(tags=["command"])


@router.post("/command", response_model=CommandResponse)
def post_command(body: CommandRequest) -> CommandResponse:
    input_text = body.text
    parsed = parse_command(input_text)
    gr = safety_service.evaluate(parsed)
    if not gr.ok:
        return CommandResponse(
            success=False,
            error_code=gr.error_code,
            input_text=input_text,
            parsed_intent=parsed.intent,
            entity=parsed.entity,
            response_text=gr.message or "Command rejected.",
        )
    response_text = execute_command_response(parsed)
    return CommandResponse(
        success=True,
        error_code=None,
        input_text=input_text,
        parsed_intent=parsed.intent,
        entity=parsed.entity,
        response_text=response_text,
    )

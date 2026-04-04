from pydantic import BaseModel, Field, field_validator


class CommandRequest(BaseModel):
    """Client command: JSON body with a single text field."""

    text: str = Field(..., min_length=1, max_length=2000, description="Raw user command text")

    @field_validator("text")
    @classmethod
    def strip_nonempty(cls, v: str) -> str:
        t = v.strip()
        if not t:
            raise ValueError("text cannot be empty or whitespace only")
        return t

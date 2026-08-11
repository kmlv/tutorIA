"""Typed sentence timings exposed with a content timeline.

The compiler deliberately stores these records in ``timeline.<lang>.json``: the
spoken audio, cue times and verbatim transcript are one language-specific artifact.
``schema.Timeline`` imports this model so FastAPI's existing session response serves
the transcript without a parallel endpoint or cache lifecycle.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class TranscriptSegment(BaseModel):
    """One selectable caption sentence from audioexplain's sync sidecar."""

    text: str = Field(min_length=1)
    start_s: float = Field(ge=0)
    end_s: float = Field(ge=0)
    part_index: int = Field(ge=0)

    @model_validator(mode="after")
    def _valid_interval(self) -> TranscriptSegment:
        if self.end_s < self.start_s:
            raise ValueError("end_s must be greater than or equal to start_s")
        return self

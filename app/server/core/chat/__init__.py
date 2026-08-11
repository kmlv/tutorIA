"""The tutor chat. Available at any moment, and structurally unable to hand over an
answer key it was never given."""

from .tutor import (
    MAX_TURNS,
    Reply,
    ask,
    build_context,
    has_markup,
    layer3_applies,
    leaks_answer,
    strip_markup,
)

__all__ = [
    "MAX_TURNS", "Reply", "ask", "build_context", "has_markup", "layer3_applies",
    "leaks_answer", "strip_markup",
]

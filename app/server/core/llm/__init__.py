"""Provider seam, role routing and cost accounting for every model call."""

from .fake import FakeProvider
from .provider import (
    LLMError, LLMNoCredit, LLMProvider, LLMRefusal, LLMRequest, LLMResult,
)
from .roles import ModelSpec, Router, RoutingError

__all__ = [
    "FakeProvider", "LLMError", "LLMNoCredit", "LLMProvider", "LLMRefusal", "LLMRequest",
    "LLMResult", "ModelSpec", "Router", "RoutingError",
]


#: Which env var names a live provider. Order matters: the first one whose key is
#: present wins, so a machine that has both stays on the provider we actually measured.
_PROVIDERS = (
    ("OPENAI_API_KEY", "openai_provider", "OpenAIProvider"),
    ("ANTHROPIC_API_KEY", "claude", "ClaudeProvider"),
    ("ANTHROPIC_AUTH_TOKEN", "claude", "ClaudeProvider"),
)


def default_provider() -> LLMProvider:
    """A real provider when credentials resolve, `FakeProvider` otherwise.

    Imported lazily so a machine with neither SDK installed still boots the server, and
    so the test-suite never touches one. Falling back rather than raising is deliberate:
    a missing key must degrade the judge, not the lesson.
    """
    import importlib
    import os

    for env, module, cls in _PROVIDERS:
        if not os.environ.get(env):
            continue
        try:
            return getattr(importlib.import_module(f".{module}", __name__), cls)()
        except (LLMError, ImportError):
            continue
    return FakeProvider()

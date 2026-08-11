"""The seam between tutorIA and any LLM provider.

Everything above this file speaks `LLMProvider`. That is what makes the judge testable
without a network call (`FakeProvider`), and what makes the M3 gate — agreement with a
human on a gold set — reproducible: an archived transcript can be replayed through a
different provider later without touching the judge.

The API key lives on this side of the seam and never reaches the browser (decision 20).
There is no code path that puts a key, or a model name, into an HTTP response.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

from .roles import ModelSpec


class LLMError(RuntimeError):
    """Any failure reaching or parsing the provider. One type, so a provider outage can
    never surface as a 500 to a student."""


class LLMRefusal(LLMError):
    """The provider's safety classifiers declined the request. Distinct from a transport
    failure because retrying the same prompt will not help, and because a refusal on a
    student's answer is a fact worth recording rather than an error to swallow."""


@dataclass(frozen=True)
class LLMRequest:
    system: str
    user: str
    #: JSON Schema the response must conform to. Enforced by the provider where it can
    #: be (Claude structured outputs) and re-validated by the caller regardless.
    json_schema: dict | None = None


@dataclass(frozen=True)
class LLMResult:
    text: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    latency_ms: int = 0
    stop_reason: str = "end_turn"
    cost_usd: float = 0.0
    meta: dict = field(default_factory=dict)


@runtime_checkable
class LLMProvider(Protocol):
    name: str

    def complete(self, spec: ModelSpec, req: LLMRequest) -> LLMResult:
        ...

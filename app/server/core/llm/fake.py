"""A provider that never touches the network.

It exists for three jobs, and the third is the one that justifies the class:

1. The test-suite runs the whole judge — prompt assembly, schema, validation, scoring —
   with no key and no cost.
2. The server boots and answers open questions even when no key is configured, instead
   of 500-ing on the student.
3. It is the adversary. Structured outputs make a real provider's JSON conform to the
   schema by construction, which means the validator in `grader_open` is never exercised
   against a real violation. `FakeProvider` is deliberately NOT constrained by the
   schema, so scripted bad output — an id outside the catalogue, a missing key point,
   evidence quoted from nowhere — reaches the validator exactly as a future model
   regression would.
"""
from __future__ import annotations

import json
from collections.abc import Callable

from .provider import LLMRequest, LLMResult
from .roles import ModelSpec

Script = Callable[[LLMRequest], str] | str


class FakeProvider:
    name = "fake"

    def __init__(self, script: Script | list[Script] | None = None) -> None:
        """`script` is the raw text to return: a string, a callable over the request, or
        a list consumed one call at a time (the last entry repeats once exhausted)."""
        self._script = script
        self._calls = 0
        self.requests: list[LLMRequest] = []

    def complete(self, spec: ModelSpec, req: LLMRequest) -> LLMResult:
        self.requests.append(req)
        s = self._script
        if isinstance(s, list):
            s = s[min(self._calls, len(s) - 1)] if s else None
        self._calls += 1

        text = s(req) if callable(s) else s
        if text is None:
            text = self._default(req)

        return LLMResult(
            text=text,
            model=spec.model,
            input_tokens=len(req.system) // 4 + len(req.user) // 4,
            output_tokens=len(text) // 4,
            latency_ms=0,
            cost_usd=0.0,
            meta={"fake": True, "call": self._calls},
        )

    @staticmethod
    def _default(req: LLMRequest) -> str:
        """Schema-shaped output with every key point absent and no misconception.

        Absent rather than present on purpose: an unconfigured fake must never make a
        student look like they mastered something. Failing closed is the only safe
        default for a grader.
        """
        schema = req.json_schema or {}
        ids: list[str] = []
        try:
            kp = schema["properties"]["key_points"]["items"]["properties"]["id"]
            ids = list(kp.get("enum", []))
        except (KeyError, TypeError):
            pass
        return json.dumps({
            "key_points": [{"id": i, "present": False, "evidence": ""} for i in ids],
            "misconception_id": "NINGUNA",
            "misconception_evidence": "",
            "confidence": "low",
            "summary": "fake provider: no judgement was made",
        }, ensure_ascii=False)

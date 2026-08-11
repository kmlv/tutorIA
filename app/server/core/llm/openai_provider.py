"""OpenAI provider.

Chosen by Kristian on 2026-08-11 over Claude. Written against the installed SDK
(`openai` 2.53) by introspecting it, not from memory — the model list, the
`response_format` shape, the usage fields and the exception classes were all read off
the package rather than recalled, because this SDK moved a long way past what I could
claim to know.

Named `openai_provider` and not `openai` so that nothing in this package can shadow the
real one.

**About "temperature 0".** It is available here, unlike on the Anthropic side, but it is
NOT what makes a grader reproducible and on the gpt-5 reasoning family it is often
rejected outright. So `temperature` is opt-in per role in `config/models.yaml` and unset
by default; what is always sent is `seed`, which is the SDK's actual best-effort
determinism lever, plus a schema the model cannot leave. Reproducibility comes from the
rubric and the schema, and it did on the previous provider too.

**Structured outputs are strict.** `strict: true` makes OpenAI reject a schema unless
every object sets `additionalProperties: false` and lists every property in `required`
— which `build_schema` already does — and in exchange the response cannot leave the
misconception enum. We still re-validate: see `grader_open.validate_output`.
"""
from __future__ import annotations

import time
from typing import Any

from .provider import LLMError, LLMNoCredit, LLMRefusal, LLMRequest, LLMResult
from .roles import ModelSpec

#: `effort` in config/models.yaml is provider-neutral; this is where it lands for
#: OpenAI. Values outside the SDK's literal set would 400, so anything unknown is
#: clamped to the nearest sane level rather than passed through.
_EFFORT = {"none", "minimal", "low", "medium", "high", "xhigh", "max"}

#: Fixed on purpose. A grader whose seed drifts cannot be compared across runs, and
#: comparing runs is the entire content of the M3 gate.
SEED = 20260811


class OpenAIProvider:
    name = "openai"

    def __init__(self, client: Any | None = None) -> None:
        """The client resolves `OPENAI_API_KEY` (plus optional `OPENAI_PROJECT` /
        `OPENAI_ORG_ID`) from the environment itself. tutorIA never reads, stores or
        logs the key — see `app/server/config.py`."""
        if client is not None:
            self.client = client
            return
        try:
            from openai import OpenAI
        except ImportError as e:  # pragma: no cover - depends on the environment
            raise LLMError(
                "the `openai` package is not installed: `uv pip install -e '.[llm]'`"
            ) from e
        self.client = OpenAI()

    def complete(self, spec: ModelSpec, req: LLMRequest) -> LLMResult:
        import openai

        kwargs: dict[str, Any] = {
            "model": spec.model,
            "messages": [
                {"role": "system", "content": req.system},
                {"role": "user", "content": req.user},
            ],
            # `max_completion_tokens`, not `max_tokens`: on the reasoning models the
            # older field is rejected, and it would not have covered reasoning tokens
            # anyway.
            "max_completion_tokens": spec.max_tokens,
            "seed": SEED,
            # Routes cache lookups by prefix. The system prompt is the invariant half,
            # so keying on the role keeps the judge's prefix warm across students.
            "prompt_cache_key": f"tutoria:{spec.role}",
        }
        if spec.effort in _EFFORT:
            kwargs["reasoning_effort"] = spec.effort
        if spec.temperature is not None:
            kwargs["temperature"] = spec.temperature
        if req.json_schema is not None:
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "open_response_verdict",
                    "schema": req.json_schema,
                    "strict": True,
                },
            }

        t0 = time.perf_counter()
        try:
            resp = self.client.chat.completions.create(**kwargs)
        except openai.APIConnectionError as e:
            raise LLMError(f"could not reach the provider: {e}") from e
        except openai.RateLimitError as e:
            # Un 429 son DOS cosas distintas con remedios opuestos, y la API las manda
            # por el mismo código: "vas muy rápido" (esperar y reintentar funciona) y
            # "te quedaste sin crédito" (esperar no sirve; hay que poner dinero).
            # Reportarlas igual costó 137 llamadas fallidas y un bake-off entero antes
            # de que alguien leyera el cuerpo del error.
            msg = str(e).lower()
            if "no credits" in msg or "insufficient_quota" in msg or "billing" in msg:
                raise LLMNoCredit(
                    "la cuenta de OpenAI no tiene crédito: reintentar no sirve, hay que "
                    "recargarla en https://platform.openai.com/settings/organization/billing"
                ) from e
            raise LLMError(f"rate limited: {e}") from e
        except openai.BadRequestError as e:
            # Almost always our fault, not the network's: a schema strict mode rejects,
            # or a parameter this model does not take. Say so rather than let it read
            # as a transient outage that a retry would fix.
            raise LLMError(f"the provider rejected the request: {e}") from e
        except openai.APIStatusError as e:
            raise LLMError(f"provider returned {e.status_code}: {e.message}") from e
        latency_ms = int((time.perf_counter() - t0) * 1000)

        choice = resp.choices[0]
        msg = choice.message

        # Refusal first, before touching `content`: on a refusal `content` is None, and
        # indexing it would turn a policy decision into an AttributeError far from the
        # cause.
        if getattr(msg, "refusal", None):
            raise LLMRefusal(f"the model declined the request: {msg.refusal}")
        if choice.finish_reason == "content_filter":
            raise LLMRefusal("the response was withheld by the content filter")
        if choice.finish_reason == "length":
            raise LLMError(
                f"response hit max_completion_tokens ({spec.max_tokens}) and the JSON is "
                f"truncated; raise max_tokens for role {spec.role} in config/models.yaml"
            )

        u = resp.usage
        cached = getattr(getattr(u, "prompt_tokens_details", None), "cached_tokens", 0) or 0
        prompt = (u.prompt_tokens or 0) if u else 0
        completion = (u.completion_tokens or 0) if u else 0
        # `prompt_tokens` already includes the cached ones; billing them at full rate
        # and then again at the cached rate would double-count. Charge the uncached
        # remainder at full price.
        uncached = max(prompt - cached, 0)

        return LLMResult(
            text=msg.content or "",
            model=resp.model,
            input_tokens=uncached,
            output_tokens=completion,
            cache_read_tokens=cached,
            latency_ms=latency_ms,
            stop_reason=choice.finish_reason,
            cost_usd=spec.cost_usd(uncached, completion, cached),
            meta={"id": resp.id, "service_tier": getattr(resp, "service_tier", None)},
        )

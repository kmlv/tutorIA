"""Anthropic provider — the ALTERNATE, kept working but not the one in use.

Kristian chose OpenAI on 2026-08-11 (`openai_provider.py`, `config/models.yaml`). This
file stays because a seam with one implementation is not a seam, and because the judges
bake-off (PLAN C13) needs a second provider to be more than a plan. It is selected only
when `ANTHROPIC_API_KEY` is set and `OPENAI_API_KEY` is not; with the `anthropic`
package absent it degrades to `FakeProvider` instead of failing.

Three things here are not obvious and are worth stating once, because each of them
overturns an assumption we were carrying into M3.

**There is no `temperature`.** `temperature`, `top_p` and `top_k` are rejected with a
400 on Claude Opus 5 and Sonnet 5. "Run the judge at temperature 0" is not a setting
that exists on these models. Reproducibility has to come from somewhere else, and it
does: a fixed rubric, an output schema the model cannot leave, a versioned prompt whose
fingerprint is stored beside every verdict, and low `effort`. Determinism was never
guaranteed by `temperature=0` on any model either — it just felt like it was.

**The schema is enforced server-side.** `output_config.format` constrains generation, so
the returned JSON conforms by construction. We validate it again in `grader_open`
anyway: the archive is replayed through other providers, `FakeProvider` is deliberately
unconstrained, and a truncated response is still malformed JSON no matter who produced
it.

**Server-side refusal fallbacks are deliberately NOT enabled.** The API can re-run a
declined request on a different model inside the same call. For a judge that would be a
bug, not a rescue: `answers.model` exists precisely so that a diagnosis can be traced to
the model that made it, and a silent substitution would break exactly that. A refusal
here becomes an `LLMRefusal`, which the shadow pipeline records as a non-judgement.
"""
from __future__ import annotations

import time
from typing import Any

from .provider import LLMError, LLMRefusal, LLMRequest, LLMResult
from .roles import ModelSpec


class ClaudeProvider:
    name = "anthropic"

    def __init__(self, client: Any | None = None) -> None:
        """The client resolves its own credentials: `ANTHROPIC_API_KEY`, then
        `ANTHROPIC_AUTH_TOKEN`, then an `ant auth login` profile. tutorIA never reads,
        stores or logs the key — an unset key is a startup-time diagnostic, not
        something to prompt anyone for."""
        if client is not None:
            self.client = client
            return
        try:
            import anthropic
        except ImportError as e:  # pragma: no cover - depends on the environment
            raise LLMError(
                "the `anthropic` package is not installed: `pip install -e '.[llm]'`"
            ) from e
        self.client = anthropic.Anthropic()

    def complete(self, spec: ModelSpec, req: LLMRequest) -> LLMResult:
        import anthropic

        output_config: dict[str, Any] = {"effort": spec.effort}
        if req.json_schema is not None:
            output_config["format"] = {"type": "json_schema", "schema": req.json_schema}

        t0 = time.perf_counter()
        try:
            resp = self.client.messages.create(
                model=spec.model,
                max_tokens=spec.max_tokens,
                # The system block is the invariant half of the prompt and carries the
                # cache breakpoint; everything that changes per answer is in the user
                # turn, after it. Below the model's minimum cacheable prefix this marker
                # simply does nothing, which is the intended failure mode.
                system=[{
                    "type": "text",
                    "text": req.system,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=[{"role": "user", "content": req.user}],
                output_config=output_config,
            )
        except anthropic.APIConnectionError as e:
            raise LLMError(f"could not reach the provider: {e}") from e
        except anthropic.RateLimitError as e:
            raise LLMError(f"rate limited: {e}") from e
        except anthropic.APIStatusError as e:
            raise LLMError(f"provider returned {e.status_code}: {e.message}") from e
        latency_ms = int((time.perf_counter() - t0) * 1000)

        u = resp.usage
        cache_read = getattr(u, "cache_read_input_tokens", 0) or 0
        cache_write = getattr(u, "cache_creation_input_tokens", 0) or 0
        billed_in = (u.input_tokens or 0) + cache_write

        # `stop_reason` is checked BEFORE touching `content`: a refusal can come back
        # with an empty content list, and indexing it would turn a policy decision into
        # an IndexError three frames away from the cause.
        if resp.stop_reason == "refusal":
            cat = getattr(getattr(resp, "stop_details", None), "category", None)
            raise LLMRefusal(f"the provider declined the request (category={cat})")

        text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")

        if resp.stop_reason == "max_tokens":
            raise LLMError(
                f"response hit max_tokens ({spec.max_tokens}) and the JSON is truncated; "
                f"raise max_tokens for role {spec.role} in config/models.yaml"
            )

        return LLMResult(
            text=text,
            model=resp.model,
            input_tokens=billed_in,
            output_tokens=u.output_tokens or 0,
            cache_read_tokens=cache_read,
            latency_ms=latency_ms,
            stop_reason=resp.stop_reason or "end_turn",
            cost_usd=spec.cost_usd(billed_in, u.output_tokens or 0, cache_read),
            meta={"request_id": getattr(resp, "_request_id", None)},
        )

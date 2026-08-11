"""Contract tests for the OpenAI provider, without a network call or a key.

The stub client returns REAL `openai.types` objects rather than mocks with the right
attribute names. That is the whole point: this file's job is to catch the day the SDK
changes a field, and a hand-rolled mock would happily keep passing while production
broke. If `ChatCompletion` gains a required field or renames one, these constructors
stop validating and the suite goes red — which is exactly the signal we want.
"""
from __future__ import annotations

import json

import pytest

openai = pytest.importorskip("openai", reason="the OpenAI SDK is an optional extra")

from openai.types.chat.chat_completion import ChatCompletion, Choice  # noqa: E402
from openai.types.chat.chat_completion_message import ChatCompletionMessage  # noqa: E402
from openai.types.completion_usage import CompletionUsage, PromptTokensDetails  # noqa: E402

from app.server.core.llm.openai_provider import SEED, OpenAIProvider  # noqa: E402
from app.server.core.llm.provider import LLMError, LLMRefusal, LLMRequest  # noqa: E402
from app.server.core.llm.roles import Router  # noqa: E402


def completion(*, content="{}", refusal=None, finish_reason="stop",
               prompt=1000, cached=0, completion_tokens=200) -> ChatCompletion:
    return ChatCompletion(
        id="chatcmpl-test",
        created=0,
        model="gpt-5.6-sol",
        object="chat.completion",
        choices=[Choice(
            finish_reason=finish_reason,
            index=0,
            message=ChatCompletionMessage(role="assistant", content=content, refusal=refusal),
        )],
        usage=CompletionUsage(
            prompt_tokens=prompt,
            completion_tokens=completion_tokens,
            total_tokens=prompt + completion_tokens,
            prompt_tokens_details=PromptTokensDetails(cached_tokens=cached),
        ),
    )


class StubClient:
    def __init__(self, resp=None, raises=None):
        self._resp, self._raises = resp, raises
        self.kwargs: dict = {}

    @property
    def chat(self):
        return self

    @property
    def completions(self):
        return self

    def create(self, **kwargs):
        self.kwargs = kwargs
        if self._raises:
            raise self._raises
        return self._resp or completion()


@pytest.fixture
def spec():
    return Router().spec("judge_open")


REQ = LLMRequest(system="sys", user="usr",
                 json_schema={"type": "object", "properties": {},
                              "required": [], "additionalProperties": False})


def test_the_request_shape_matches_the_sdk_contract(spec):
    stub = StubClient()
    OpenAIProvider(client=stub).complete(spec, REQ)
    k = stub.kwargs

    assert k["model"] == spec.model
    assert k["messages"][0]["role"] == "system"
    # `max_tokens` is rejected on the reasoning models and would not have covered
    # reasoning tokens anyway.
    assert "max_tokens" not in k and k["max_completion_tokens"] == spec.max_tokens
    assert k["seed"] == SEED
    assert k["reasoning_effort"] == spec.effort
    assert k["response_format"]["type"] == "json_schema"
    assert k["response_format"]["json_schema"]["strict"] is True
    assert k["response_format"]["json_schema"]["schema"] is REQ.json_schema


def test_temperature_is_not_sent_unless_a_role_asks_for_it(spec):
    stub = StubClient()
    OpenAIProvider(client=stub).complete(spec, REQ)
    assert "temperature" not in stub.kwargs, (
        "the gpt-5 reasoning family rejects temperature; determinism comes from the "
        "seed and the schema"
    )

    import dataclasses
    stub2 = StubClient()
    OpenAIProvider(client=stub2).complete(dataclasses.replace(spec, temperature=0.0), REQ)
    assert stub2.kwargs["temperature"] == 0.0


def test_a_schema_free_request_sends_no_response_format(spec):
    stub = StubClient()
    OpenAIProvider(client=stub).complete(spec, LLMRequest(system="s", user="u"))
    assert "response_format" not in stub.kwargs


def test_cached_prompt_tokens_are_not_billed_twice(spec):
    """`prompt_tokens` already contains the cached ones. Charging the full count at
    input price and then the cached count again would overstate every warm call."""
    stub = StubClient(completion(prompt=1000, cached=800, completion_tokens=0))
    res = OpenAIProvider(client=stub).complete(spec, REQ)

    assert (res.input_tokens, res.cache_read_tokens) == (200, 800)
    expected = (200 / 1e6) * spec.usd_in_per_mtok + (800 / 1e6) * spec.usd_in_per_mtok * 0.1
    assert res.cost_usd == pytest.approx(expected)


def test_cost_uses_the_real_price_of_the_judge_model(spec):
    res = OpenAIProvider(client=StubClient(completion(prompt=1_000_000, completion_tokens=0))
                         ).complete(spec, REQ)
    assert res.cost_usd == pytest.approx(5.00), "gpt-5.6-sol input is $5.00 / MTok"


def test_a_refusal_is_raised_as_a_refusal_not_read_as_content(spec):
    stub = StubClient(completion(content=None, refusal="I can't help with that"))
    with pytest.raises(LLMRefusal, match="declined"):
        OpenAIProvider(client=stub).complete(spec, REQ)


def test_the_content_filter_is_a_refusal_too(spec):
    stub = StubClient(completion(content=None, finish_reason="content_filter"))
    with pytest.raises(LLMRefusal, match="content filter"):
        OpenAIProvider(client=stub).complete(spec, REQ)


def test_truncation_names_the_setting_that_fixes_it(spec):
    stub = StubClient(completion(content='{"key_poi', finish_reason="length"))
    with pytest.raises(LLMError, match="max_tokens for role judge_open"):
        OpenAIProvider(client=stub).complete(spec, REQ)


def test_a_bad_request_is_not_reported_as_an_outage(spec):
    """A schema strict mode rejects is our bug. Reporting it like a network blip sends
    whoever reads the log looking in the wrong place, and invites a pointless retry."""
    import httpx
    err = openai.BadRequestError(
        "invalid schema",
        response=httpx.Response(400, request=httpx.Request("POST", "https://x")),
        body=None,
    )
    with pytest.raises(LLMError, match="rejected the request"):
        OpenAIProvider(client=StubClient(raises=err)).complete(spec, REQ)


def test_the_judge_runs_end_to_end_through_the_stubbed_sdk():
    """The judge, the provider and the real SDK response objects, wired together."""
    from app.server.core.content.loader import FilesystemPackSource
    from app.server.core.judge.grader_open import judge_open

    pack = FilesystemPackSource().get_pack("budget-line", "es")
    q = next(x for x in pack.questions if x.id == "q_cp2_why_intercept_fixed")
    answer = "ese intercepto es m/p2 y ni m ni p2 cambiaron"
    body = json.dumps({
        "key_points": [{"id": k.id, "present": True, "evidence": "m/p2"} for k in q.key_points],
        "misconception_id": "NINGUNA",
        "misconception_evidence": "",
        "confidence": "high",
        "summary": "ok",
    })

    stub = StubClient(completion(content=body, prompt=900, cached=512, completion_tokens=120))
    v = judge_open(q, answer, pack, lang="es", provider=OpenAIProvider(client=stub))

    assert (v.correcta, v.score) == (True, 1.0)
    assert v.model == "gpt-5.6-sol"
    assert v.cost_usd > 0
    assert v.judge["_derived"]["usage"]["cache_read_tokens"] == 512

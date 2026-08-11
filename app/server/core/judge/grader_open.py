"""The LLM judge for open responses.

Two design commitments carry over from the deterministic graders and are what keep this
file from becoming "ask a model if the student is right".

**The model does not decide the verdict.** It reports, per rubric line, whether the
student said that thing and quotes the words where they said it. The score is computed
here, from those booleans, by rules that are readable and testable without a network
call. A model that returns `"correct": true` is not asked, and would not be believed.

**A misconception id is only claimed on evidence.** The output enum includes `NINGUNA`
and `FUERA_DE_CATALOGO` (finding of T-002, lane C): without those two escapes the model
is forced to emit a catalogued id even when the student made no catalogued error, and
the "zero out-of-catalogue ids" gate passes by construction while meaning nothing.

The quoted evidence is checked against the student's own text. A quote the student never
wrote does not silently invalidate the verdict — it is recorded as `evidence_unverified`
and surfaces in the concordance report, because whether hallucinated evidence predicts
disagreement with Kristian is a question the gold set should answer, not one this file
should assume.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

from ..content.schema import Pack, Question
from ..llm.provider import LLMError, LLMNoCredit, LLMProvider, LLMRefusal, LLMRequest
from ..llm.roles import ModelSpec, Router

#: Bump on any change to the semantics of the prompt. The fingerprint appended at
#: runtime catches the changes people forget to bump, which is most of them.
PROMPT_VERSION = "open-judge/v1"

MAX_ANSWER_CHARS = 4000

SYSTEM_PROMPT = """\
You are the grading component of a microeconomics tutor. You are not talking to the
student: your entire output is JSON consumed by a program.

You are given one question, a rubric of key points, a catalogue of known misconceptions,
and one student's answer. Do three things.

1. For every key point, decide whether the student's answer actually expresses that
   idea, and quote the exact words that show it. Quote verbatim from the answer, copying
   the student's own spelling and wording; never paraphrase, translate or repair the
   quote. If the idea is absent, mark it absent and leave the quote empty.

2. Decide whether the answer displays one of the catalogued misconceptions, and quote
   the words that show it. Use `NINGUNA` when the answer displays no catalogued
   misconception, including when the answer is simply incomplete or empty. Use
   `FUERA_DE_CATALOGO` when the answer displays a clear conceptual error that no
   catalogue entry describes. Never stretch a catalogue entry to fit: naming a
   confusion the student did not show is worse than naming none.

3. Report your confidence.

How to grade:

- Grade the economics, not the writing. A correct idea in clumsy, informal or
  ungrammatical words is present. A fluent restatement of the question is not.
- The student does not have to use the formula, the technical term, or any symbols.
  Everyday wording for the right idea counts.
- The student writes in Spanish or in English. Grade whichever they used, and do not
  penalise mixing the two.
- Numbers matter. If a key point names a quantity, the student's number must match for
  that point to be present.
- An answer can be wrong without displaying any catalogued misconception. Those are
  independent judgements: absent key points do not imply a misconception, and a correct
  answer can still contain one in passing.
- Judge only what is written. Do not infer what the student probably meant, and do not
  give credit for what they would likely say if asked again.
"""


@dataclass
class OpenVerdict:
    correcta: bool
    score: float
    misconception_id: str | None = None
    invalida: bool = False
    #: The provider's parsed output plus what we derived from it. Stored whole in
    #: `answers.judge_json` so a verdict can be re-audited without re-running the model.
    judge: dict = field(default_factory=dict)
    model: str | None = None
    prompt_version: str | None = None
    latency_ms: int | None = None
    cost_usd: float = 0.0
    error: str | None = None
    #: Clase del fallo, no su texto. `run_judge` corta el lote con esto en vez de buscar
    #: una palabra dentro del mensaje, que se rompe al traducirlo o al reescribirlo.
    error_kind: str | None = None


def prompt_fingerprint() -> str:
    return hashlib.sha256(SYSTEM_PROMPT.encode("utf-8")).hexdigest()[:12]


def prompt_id() -> str:
    """What lands in `answers.prompt_version`.

    `open-judge/v1+9f2c1a3b4d5e`. The suffix means an edit to the prompt text is visible
    in the data even when nobody remembered to bump the version, which is the failure
    mode that makes historical verdicts quietly incomparable.
    """
    return f"{PROMPT_VERSION}+{prompt_fingerprint()}"


# --- prompt assembly --------------------------------------------------------

def build_schema(q: Question, pack: Pack) -> dict:
    kp_ids = [k.id for k in (q.key_points or [])]
    return {
        "type": "object",
        "properties": {
            "key_points": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "enum": kp_ids},
                        "present": {"type": "boolean"},
                        "evidence": {
                            "type": "string",
                            "description": "Verbatim words from the student's answer; "
                                           "empty when the key point is absent.",
                        },
                    },
                    "required": ["id", "present", "evidence"],
                    "additionalProperties": False,
                },
            },
            "misconception_id": {
                "type": "string",
                "enum": pack.enum_misconceptions,
            },
            "misconception_evidence": {"type": "string"},
            "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
            "summary": {
                "type": "string",
                "description": "One sentence, for the instructor. Never shown to the "
                               "student.",
            },
        },
        "required": ["key_points", "misconception_id", "misconception_evidence",
                     "confidence", "summary"],
        "additionalProperties": False,
    }


def build_user(q: Question, pack: Pack, answer: str, lang: str) -> str:
    def loc(x: Any) -> str:
        return getattr(x, lang, None) or getattr(x, "en")

    parts = [
        "## Question",
        loc(q.enunciado),
        "",
        "## Rubric — key points",
    ]
    for k in q.key_points or []:
        tag = "required" if k.esencial else "optional"
        parts.append(f"- `{k.id}` ({tag}): {loc(k)}")

    # Only the misconceptions this item is meant to catch, plus anything its own
    # diagnosis map names. The full catalogue would put ids in front of the model that
    # this question cannot legitimately produce, which is how out-of-catalogue-adjacent
    # noise gets in.
    watched = list(dict.fromkeys(
        list(q.misconceptions_vigilar)
        + [v for v in (q.diagnostico_si_falla or {}).values() if v]
    ))
    parts += ["", "## Misconception catalogue for this question"]
    if watched:
        for mid in watched:
            m = pack.misconception(mid)
            parts.append(f"- `{mid}` — {loc(m.nombre)}. Observable sign: {m.señal_observable}")
    else:
        parts.append("- (none catalogued for this item)")
    parts.append("- `NINGUNA` — no catalogued misconception is displayed.")
    parts.append("- `FUERA_DE_CATALOGO` — a clear conceptual error none of the above describes.")

    e = pack.ejemplo
    parts += [
        "",
        "## Numbers in play",
        f"- {loc(e.bien_1)}: price {e.p1}",
        f"- {loc(e.bien_2)}: price {e.p2}",
        f"- income: {e.m}",
        "",
        "## Student's answer",
        "<answer>",
        answer.strip()[:MAX_ANSWER_CHARS],
        "</answer>",
    ]
    return "\n".join(parts)


# --- evidence verification --------------------------------------------------

def _norm(s: str) -> str:
    """Casefolded, accent-stripped, whitespace-collapsed.

    Accents go because a student typing `porque` for `porqué` should not make a quote
    look fabricated, and the check exists to catch invention, not typing.
    """
    s = unicodedata.normalize("NFD", s.casefold())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip()


def evidence_in_answer(quote: str, answer: str) -> bool:
    q = _norm(quote)
    if len(q) < 4:
        # Too short to distinguish a real quote from a coincidence.
        return True
    return q in _norm(answer)


# --- validation -------------------------------------------------------------

class JudgeOutputError(ValueError):
    """The provider returned something the judge cannot act on."""


def validate_output(raw: str, q: Question, pack: Pack) -> dict:
    """Re-checks server-enforced constraints.

    Structured outputs make a real provider's JSON conform by construction, so on the
    happy path this never fires. It exists for the paths where that guarantee does not
    hold: `FakeProvider`, an archived transcript replayed through another provider, a
    truncated response, and any future model or SDK change that quietly relaxes the
    constraint. A grader that trusts its input is a grader with no failure mode it can
    report.
    """
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as e:
        raise JudgeOutputError(f"the response is not JSON: {e}") from e
    if not isinstance(data, dict):
        raise JudgeOutputError(f"expected an object, got {type(data).__name__}")

    allowed = set(pack.enum_misconceptions)
    mid = data.get("misconception_id")
    if mid not in allowed:
        raise JudgeOutputError(f"misconception_id {mid!r} is outside the enum")

    expected = {k.id for k in (q.key_points or [])}
    items = data.get("key_points")
    if not isinstance(items, list):
        raise JudgeOutputError("key_points is missing or is not a list")

    seen: dict[str, dict] = {}
    for it in items:
        if not isinstance(it, dict) or it.get("id") not in expected:
            raise JudgeOutputError(f"unknown key point in the response: {it!r:.80}")
        if not isinstance(it.get("present"), bool):
            raise JudgeOutputError(f"key point {it.get('id')!r}: `present` is not a boolean")
        seen[it["id"]] = it

    missing = expected - set(seen)
    if missing:
        # Silently treating an omitted key point as absent would let a truncated
        # response read as a confident low score.
        raise JudgeOutputError(f"key points not judged: {sorted(missing)}")

    data["key_points"] = [seen[k.id] for k in (q.key_points or [])]
    return data


# --- scoring ----------------------------------------------------------------

def score_from(data: dict, q: Question) -> tuple[bool, float]:
    """`correcta` needs every *essential* key point; `score` is the full fraction.

    Two different questions, so two different numbers. Mastery asks "did they get it",
    which the essential points define. The instructor asks "how close were they", which
    a partial fraction answers and a boolean throws away.
    """
    kps = q.key_points or []
    by_id = {it["id"]: it for it in data["key_points"]}
    present = sum(1 for k in kps if by_id[k.id]["present"])
    essential_ok = all(by_id[k.id]["present"] for k in kps if k.esencial)
    frac = round(present / len(kps), 2) if kps else 0.0
    return essential_ok, (1.0 if essential_ok else frac)


# --- entry point ------------------------------------------------------------

def judge_open(q: Question, answer: Any, pack: Pack, *, lang: str,
               provider: LLMProvider, spec: ModelSpec | None = None,
               router: Router | None = None) -> OpenVerdict:
    if q.modalidad != "open":
        raise ValueError(f"{q.id}: judge_open only grades open questions")

    if not isinstance(answer, str) or not answer.strip():
        # No model call: an empty answer has nothing to judge and paying for a verdict
        # on it would be paying to be told so.
        return OpenVerdict(False, 0.0, invalida=True, prompt_version=prompt_id(),
                           judge={"skipped": "empty answer"})

    spec = spec or (router or Router()).spec("judge_open")
    req = LLMRequest(
        system=SYSTEM_PROMPT,
        user=build_user(q, pack, answer, lang),
        json_schema=build_schema(q, pack),
    )

    try:
        res = provider.complete(spec, req)
    except LLMRefusal as e:
        return OpenVerdict(False, 0.0, invalida=True, model=spec.model,
                           prompt_version=prompt_id(), error=str(e),
                           error_kind="refusal", judge={"refusal": str(e)})
    except LLMNoCredit as e:
        return OpenVerdict(False, 0.0, invalida=True, model=spec.model,
                           prompt_version=prompt_id(), error=str(e),
                           error_kind="no_credit", judge={"provider_error": str(e)})
    except LLMError as e:
        return OpenVerdict(False, 0.0, invalida=True, model=spec.model,
                           prompt_version=prompt_id(), error=str(e),
                           error_kind="provider", judge={"provider_error": str(e)})

    try:
        data = validate_output(res.text, q, pack)
    except JudgeOutputError as e:
        return OpenVerdict(False, 0.0, invalida=True, model=res.model,
                           prompt_version=prompt_id(), latency_ms=res.latency_ms,
                           cost_usd=res.cost_usd, error=str(e),
                           judge={"invalid_output": str(e), "raw": res.text[:2000]})

    unverified = [
        it["id"] for it in data["key_points"]
        if it["present"] and not evidence_in_answer(it.get("evidence", ""), answer)
    ]
    mid_raw = data["misconception_id"]
    # `FUERA_DE_CATALOGO` is a real claim about the answer and still owes evidence; only
    # `NINGUNA` asserts nothing and so has nothing to quote.
    mid = None if mid_raw in ("NINGUNA", "FUERA_DE_CATALOGO") else mid_raw
    unverified_mid = mid_raw != "NINGUNA" and not evidence_in_answer(
        data.get("misconception_evidence", ""), answer)

    correcta, score = score_from(data, q)
    data["_derived"] = {
        "correcta": correcta,
        "score": score,
        "evidence_unverified": unverified,
        "misconception_evidence_unverified": unverified_mid,
        "out_of_catalogue": mid_raw == "FUERA_DE_CATALOGO",
        "usage": {
            "input_tokens": res.input_tokens,
            "output_tokens": res.output_tokens,
            "cache_read_tokens": res.cache_read_tokens,
            "cost_usd": round(res.cost_usd, 6),
        },
    }

    return OpenVerdict(
        correcta=correcta, score=score, misconception_id=mid, judge=data,
        model=res.model, prompt_version=prompt_id(), latency_ms=res.latency_ms,
        cost_usd=res.cost_usd,
    )

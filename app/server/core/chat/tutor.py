"""The tutor chat: the student can ask at any moment, and the tutor must not solve.

The whole design is organised around one finding from T-002. Bastani et al. (PNAS 2025)
measured +48% while the AI was in front of the student and **-17% on the exam without
it**; the same study with guardrails got +127% in practice and *flat* on the exam. A chat
that answers the question is not a neutral convenience — it is the mechanism by which a
tutor produces students who can't do it alone.

So the guardrail is built in three layers, and only the first is structural.

**Layer 1 — the tutor is never given the answer.** `build_context` sends the question
stem and nothing else: no `respuesta`, no `verificacion`, no `key_points`, no correct
option. This is the only layer that cannot be talked around, and it is the reason the
context is assembled here instead of by handing the model a `Question`.

**Layer 2 — the prompt.** It says what to do (ask back, name the next step, point at a
representation) and what never to do. Prompts are steering, not enforcement; this layer
exists because it works most of the time, not because it can be relied on.

**Layer 3 — a check on the way out.** For deterministic items we can compute the answer
server-side, so we check whether the reply contains it and replace the reply if it does.
The block is recorded as an event rather than swallowed, because how often the tutor
tries to solve is a number we want, not an embarrassment to hide.

Layer 3 cannot catch everything — a model can walk a student through an equivalent
derivation without ever writing the number. That is a real limit and it is why layer 1
matters most: the tutor genuinely does not know which of the four options is correct.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from ..content.schema import Ejemplo, Pack, Question
from ..judge.deterministic import ExpressionError, eval_expr
from ..llm.provider import LLMError, LLMProvider, LLMRefusal, LLMRequest
from ..llm.roles import Router
from ..mastery.state import SubSkillState

#: Per session. Not a cost control — a pedagogical one. An unbounded chat is an
#: invitation to outsource the thinking, and the budget makes the student spend their
#: questions on what they actually don't understand.
MAX_TURNS = 12
MAX_QUESTION_CHARS = 800

SYSTEM_PROMPT = """\
You are a tutor for an intermediate microeconomics course, talking to one student in the
middle of a short lesson on the budget line. Reply in the student's language.

**You do not give answers.** The student is working on ungraded questions whose answers
you have deliberately not been given. Your job is to get them unstuck enough to answer
for themselves, and a student who leaves with your answer instead of their own reasoning
has been harmed by this conversation, not helped.

What to do:
- Ask the one question that would move them forward. Usually it is smaller and more
  concrete than the one they asked you.
- Point at the specific thing to look at — an intercept, a slope, a bundle — and let
  them read it.
- Offer a different representation when words are not landing: a number, a table, a
  picture in words.
- Answer definitional questions directly. What a term means is not the exercise; making
  them guess vocabulary is just an obstacle.

What never to do:
- State the numeric answer, name the correct option, or say whether their answer is
  right. You are not the grader and you do not know.
- Work the calculation for them, even partially. Set it up if they ask, and stop before
  the arithmetic.
- Say "correct" or "wrong" about anything they propose. Ask them how they'd check it.

Be brief. Two or three sentences is usually right, and one question is usually better
than three. Do not open with pleasantries and do not close by offering more help.

**Write plain prose.** Your reply is inserted into the page as text, so LaTeX and
Markdown arrive at the student as literal characters: `\\(100 \\div 3\\)` shows up on
screen exactly like that, and `**word**` keeps its asterisks. Write "100 divided by 3",
not a formula. No backslashes, no dollar signs around maths, no asterisks, no headings,
no bullet lists.
"""

#: Anything that would reach the student as literal markup. Checked on the way out for
#: the same reason as the answer leak: a prompt is steering, and this one is cheap to
#: verify. Found by running the tutor against the real model, not by reading the code —
#: the first live reply came back with `\\(100 \\div 3\\)` in it.
_MARKUP = re.compile(r"\\\(|\\\)|\\\[|\\]|\\[a-zA-Z]+|\*\*|\$\$?|^#{1,6}\s", re.M)


def strip_markup(text: str) -> str:
    """Removes markup rather than blocking the reply. The content is fine; only the
    packaging is wrong, and throwing away a good answer over formatting would be a worse
    trade than tidying it."""
    text = re.sub(r"\\\((.+?)\\\)", r"\1", text, flags=re.S)
    text = re.sub(r"\\\[(.+?)\\]", r"\1", text, flags=re.S)
    text = re.sub(r"\$\$?(.+?)\$\$?", r"\1", text, flags=re.S)
    text = text.replace("\\div", "÷").replace("\\times", "×").replace("\\cdot", "·")
    text = re.sub(r"\\frac\{(.+?)\}\{(.+?)\}", r"\1/\2", text)
    text = re.sub(r"\\[a-zA-Z]+\s?", "", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text, flags=re.S)
    text = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"\1", text, flags=re.S)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.M)
    return re.sub(r"[ \t]{2,}", " ", text).strip()


def has_markup(text: str) -> bool:
    return bool(_MARKUP.search(text))

REDIRECT = {
    "es": "Antes de darte eso: ¿qué parte del cálculo puedes hacer tú, y dónde te trabas?",
    "en": "Before I give you that: which part can you do yourself, and where do you get stuck?",
}

LIMIT = {
    "es": "Ya usaste tus preguntas para esta sesión. Sigue con la actividad; lo que "
          "quedó pendiente aparece para tu instructor.",
    "en": "You've used your questions for this session. Keep going; anything still "
          "unresolved is surfaced to your instructor.",
}


@dataclass
class Reply:
    text: str
    blocked: bool = False
    #: LaTeX or Markdown was removed on the way out. Recorded so the rate is visible:
    #: if it is high, the prompt needs work, not the stripper.
    tidied: bool = False
    limited: bool = False
    model: str | None = None
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    error: str | None = None


def givens(e: Ejemplo) -> list[float]:
    """The numbers the tutor must be free to say. Stating the problem is not leaking it."""
    return [e.p1, e.p2, e.m]


def _expected_numbers(q: Question, e: Ejemplo) -> list[float]:
    """Every number that would count as giving the answer away — when we can tell.

    Nothing for `mcq`, `open` and `manip`: we have no single number to look for, so
    layer 3 does not apply and layers 1 and 2 carry the whole load.

    **And nothing when the answer coincides with a given.** In this very pack,
    `q_int_numeric_1` asks for the juice intercept, which is `m / p2` = 100 / 1 = 100 —
    exactly the income. A tutor that cannot write "you have 100 dollars" cannot state the
    problem, so blocking there would break the tutor to protect an answer the student can
    read off the question. When the two collide, layer 3 abstains; `layer3_applies` makes
    that inspectable instead of leaving it as silently absent behaviour.
    """
    spec = q.respuesta or {}
    if q.modalidad != "numeric" or not spec.get("expr"):
        return []
    try:
        v = eval_expr(spec["expr"], {"p1": e.p1, "p2": e.p2, "m": e.m})
    except ExpressionError:
        return []
    if any(abs(v - g) <= max(0.05, abs(g) * 0.005) for g in givens(e)):
        return []
    return [v]


def layer3_applies(q: Question | None, e: Ejemplo) -> bool:
    """Whether the outbound check can say anything about this item. Worth asking out
    loud: a guardrail that is silently inert on some items is worse than one that
    reports where it does not reach."""
    return bool(q is not None and _expected_numbers(q, e))


def leaks_answer(text: str, q: Question | None, e: Ejemplo) -> bool:
    """Does the reply contain the answer to the item currently in play?

    Matched with a tolerance and on token boundaries. `33.3` must not be found inside
    `133.35`, and a tutor that says "your income is 100" has not leaked the answer to a
    question whose answer happens to be 100 — which is why this is only consulted for the
    ONE pending question, not for every number in the pack.
    """
    if q is None:
        return False
    expected = _expected_numbers(q, e)
    if not expected:
        return False
    found = [float(m) for m in re.findall(r"-?\d+(?:[.,]\d+)?", text.replace(",", "."))]
    return any(abs(f - x) <= max(0.05, abs(x) * 0.005) for x in expected for f in found)


def build_context(pack: Pack, lang: str, *, pending: Question | None,
                  cue_id: str | None, states: dict[str, SubSkillState] | None) -> str:
    """Everything the tutor is allowed to know.

    Assembled by hand, field by field, rather than by serialising a `Question` — because
    `Question` carries `respuesta`, `verificacion`, `key_points` and which option is
    correct, and a future field added to that model would otherwise silently start
    reaching the tutor.
    """
    e = pack.ejemplo
    parts = [
        "## The lesson",
        f"Concept: {getattr(pack.titulo, lang)}",
        f"Good 1: {getattr(e.bien_1, lang)}, price {e.p1}. "
        f"Good 2: {getattr(e.bien_2, lang)}, price {e.p2}. Income: {e.m}.",
    ]
    if cue_id:
        parts.append(f"The student is at the point of the narration called `{cue_id}`.")

    if pending is not None:
        parts += [
            "",
            "## The question the student is working on",
            getattr(pending.enunciado, lang),
            "You have NOT been told its answer, and you must not try to work it out for "
            "them.",
        ]
        if pending.opciones:
            # The options, deliberately shuffled out of their stored order and stripped
            # of every flag, so neither the model nor a leaked prompt can infer which one
            # is correct from position.
            opts = sorted(getattr(o, lang) for o in pending.opciones)
            parts.append("The options they are choosing between, in no meaningful "
                         "order: " + "; ".join(opts))

    if states:
        active = sorted({m for s in states.values() for m in s.active_misconceptions})
        if active:
            probes = []
            for mid in active:
                mc = pack.misconception(mid)
                probes.append(f"- {getattr(mc.socratic_probe, lang).strip()}")
            parts += [
                "",
                "## What this student has already got wrong",
                "They have shown a specific confusion. Do not name it or diagnose them "
                "out loud. These are questions that have worked for it before — use one "
                "if it fits what they are asking:",
                *probes,
            ]
    return "\n".join(parts)


def ask(question: str, pack: Pack, *, lang: str, provider: LLMProvider,
        history: list[dict] | None = None, pending: Question | None = None,
        cue_id: str | None = None, states: dict[str, SubSkillState] | None = None,
        router: Router | None = None, turns_used: int = 0) -> Reply:
    if turns_used >= MAX_TURNS:
        return Reply(LIMIT.get(lang, LIMIT["en"]), limited=True)

    q = (question or "").strip()[:MAX_QUESTION_CHARS]
    if not q:
        return Reply("", error="empty question")

    spec = (router or Router()).spec("chat")
    convo = "\n".join(f"{h['role']}: {h['content']}" for h in (history or [])[-6:])
    user = build_context(pack, lang, pending=pending, cue_id=cue_id, states=states)
    if convo:
        user += f"\n\n## Earlier in this conversation\n{convo}"
    user += f"\n\n## The student asks\n{q}"

    try:
        res = provider.complete(spec, LLMRequest(system=SYSTEM_PROMPT, user=user))
    except LLMRefusal as e:
        return Reply(REDIRECT.get(lang, REDIRECT["en"]), error=str(e))
    except LLMError as e:
        return Reply(REDIRECT.get(lang, REDIRECT["en"]), error=str(e))

    text = res.text.strip()
    tidied = has_markup(text)
    if tidied:
        text = strip_markup(text)
    # After stripping, not before: `\(33.3\)` must still be caught as a leak.
    blocked = leaks_answer(text, pending, pack.ejemplo)
    if blocked:
        text = REDIRECT.get(lang, REDIRECT["en"])

    return Reply(text=text, blocked=blocked, tidied=tidied, model=res.model,
                 tokens_in=res.input_tokens, tokens_out=res.output_tokens,
                 cost_usd=res.cost_usd)

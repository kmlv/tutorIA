"""The tutor chat, and the one property that matters: it cannot hand over the answer.

The tests are organised by guardrail layer, because the layers have different strengths
and conflating them would hide that. Layer 1 is structural and is tested by inspecting
what actually reaches the model. Layer 3 is a check and is tested by feeding it a reply
that leaks. Layer 2 is the prompt, which no unit test can verify — the closest we get is
asserting the instructions are present, and that assertion is worth exactly what it says
and no more.
"""
from __future__ import annotations

import pytest

from app.server.core import chat
from app.server.core.content.loader import FilesystemPackSource
from app.server.core.llm import FakeProvider
from app.server.core.llm.provider import LLMError
from app.server.core.mastery import compute

PACK = "budget-line"


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack(PACK, "es")


@pytest.fixture
def numeric_q(pack):
    """`q_int_numeric_2` — the coffee intercept, m/p1 = 33.3. Deterministic AND distinct
    from every given, so layer 3 can actually say something about it."""
    return next(q for q in pack.questions if q.id == "q_int_numeric_2")


@pytest.fixture
def colliding_q(pack):
    """`q_int_numeric_1` — the juice intercept, m/p2 = 100/1 = 100, which IS the income.
    The item where layer 3 has to abstain."""
    return next(q for q in pack.questions if q.id == "q_int_numeric_1")


# --- layer 1: what the model is actually given ------------------------------

def test_the_context_never_contains_the_answer_key(pack, numeric_q):
    ctx = chat.build_context(pack, "es", pending=numeric_q, cue_id=None, states=None)
    assert numeric_q.enunciado.es in ctx, "the stem must be there — that is the point"
    for forbidden in (numeric_q.respuesta or {}).values():
        assert str(forbidden) not in ctx


def test_mcq_options_reach_the_tutor_without_which_one_is_right(pack):
    q = next(x for x in pack.questions if x.modalidad == "mcq" and x.opciones)
    ctx = chat.build_context(pack, "es", pending=q, cue_id=None, states=None)
    for o in q.opciones:
        assert o.es in ctx
    # Stored order leaks the answer on its own if the correct option is always first;
    # the context sorts them so position carries nothing.
    correct = next(o for o in q.opciones if o.correcta)
    assert "correcta" not in ctx and "correct" not in ctx.lower()
    others = [o.es for o in q.opciones if not o.correcta]
    assert any(ctx.index(o) < ctx.index(correct.es) for o in others) or \
        sorted([correct.es] + others)[0] != correct.es


def test_an_active_misconception_arrives_as_a_probe_not_as_a_diagnosis(pack):
    rows = [{"question_id": "q_slope_numeric", "modalidad": "numeric",
             "grader": "deterministic", "score": 0.0, "misconception_id": "BL-M1",
             "con_andamiaje": False}]
    states = compute(pack, rows)
    ctx = chat.build_context(pack, "es", pending=None, cue_id=None, states=states)
    assert "BL-M1" not in ctx, "the tutor must not be able to name the id at the student"
    assert pack.misconception("BL-M1").socratic_probe.es.strip()[:40] in ctx


def test_no_pending_question_means_no_question_section(pack):
    ctx = chat.build_context(pack, "es", pending=None, cue_id="slope", states=None)
    assert "slope" in ctx
    assert "working on" not in ctx


# --- layer 3: the check on the way out --------------------------------------

def test_a_reply_containing_the_answer_is_replaced(pack, numeric_q):
    # The intercept is m/p1 = 100/3 = 33.3.
    leak = FakeProvider("El intercepto del café es 33.3 kilos, se saca de 100 entre 3.")
    r = chat.ask("¿cuánto es el intercepto del café?", pack, lang="es",
                 provider=leak, pending=numeric_q)
    assert r.blocked is True
    assert "33" not in r.text
    assert r.text == chat.tutor.REDIRECT["es"]


def test_a_helpful_reply_that_does_not_leak_passes_through(pack, numeric_q):
    good = FakeProvider("¿Qué pasa si gastas todo tu ingreso en café? Empieza por ahí.")
    r = chat.ask("no entiendo", pack, lang="es", provider=good, pending=numeric_q)
    assert r.blocked is False
    assert r.text.startswith("¿Qué pasa")


def test_the_check_does_not_fire_on_numbers_that_are_merely_given(pack, numeric_q):
    """Restating the student's income is not leaking the answer to a question whose
    answer is a different number. Checking every number in the pack instead of the one
    pending answer would make the guardrail useless by firing constantly."""
    r = chat.ask("?", pack, lang="es", pending=numeric_q,
                 provider=FakeProvider("Recuerda que tienes 100 dólares y el café "
                                       "cuesta 3."))
    assert r.blocked is False


def test_layer_three_abstains_when_the_answer_IS_a_given(pack, colliding_q, numeric_q):
    """The juice intercept is m/p2 = 100, which is the income. If layer 3 fired here the
    tutor could not write "you have 100 dollars" — it could not state the problem. So it
    abstains, and says so, rather than protecting an answer the student can read off the
    question at the cost of breaking the tutor."""
    assert chat.layer3_applies(colliding_q, pack.ejemplo) is False
    # And it does reach the sibling item, so the abstention is about THIS answer
    # colliding with a given, not about numeric items in general.
    assert chat.layer3_applies(numeric_q, pack.ejemplo) is True

    r = chat.ask("?", pack, lang="es", pending=colliding_q,
                 provider=FakeProvider("Con 100 dólares y el jugo a 1, ¿qué sale?"))
    assert r.blocked is False


def test_the_check_is_not_fooled_by_a_number_inside_a_longer_one(pack, numeric_q):
    assert chat.leaks_answer("cuesta 1333.35 en total", numeric_q, pack.ejemplo) is False
    assert chat.leaks_answer("son 33.33 kilos", numeric_q, pack.ejemplo) is True


def test_layer_three_does_not_apply_to_mcq_or_open(pack):
    """Stated as a test so the limit is visible rather than assumed. For these
    modalities layers 1 and 2 carry the whole load, and layer 1 is what makes that
    survivable: the tutor genuinely does not know which option is correct."""
    for mod in ("mcq", "open"):
        q = next(x for x in pack.questions if x.modalidad == mod)
        assert chat.leaks_answer("la respuesta es la B, 33.3, definitivamente",
                                 q, pack.ejemplo) is False


# --- the budget -------------------------------------------------------------

def test_the_turn_budget_stops_the_conversation_without_a_model_call(pack):
    fake = FakeProvider("no debería llegar aquí")
    r = chat.ask("otra pregunta", pack, lang="es", provider=fake,
                 turns_used=chat.MAX_TURNS)
    assert r.limited is True
    assert fake.requests == [], "the limit must be checked before paying for a call"


def test_a_provider_failure_becomes_a_redirect_not_a_stack_trace(pack):
    class Down:
        name = "down"
        def complete(self, spec, req): raise LLMError("network down")

    r = chat.ask("¿por qué?", pack, lang="es", provider=Down())
    assert r.text == chat.tutor.REDIRECT["es"]
    assert r.error and not r.blocked


# --- layer 2: the prompt (asserted, not verified) ---------------------------

def test_the_prompt_forbids_grading_and_calculating():
    """This asserts the instructions exist. It does not verify the model follows them —
    no unit test can, which is exactly why layers 1 and 3 are not optional."""
    p = chat.tutor.SYSTEM_PROMPT.lower()
    assert "do not give answers" in p
    assert "numeric answer" in p and "correct option" in p
    assert "you are not the grader" in p


# --- the API ----------------------------------------------------------------

def test_the_endpoint_records_both_turns_and_the_block(pack, monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "chat.sqlite"))
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    importlib.reload(m)
    m.provider = FakeProvider("son 33.3 kilos exactos")
    c = TestClient(m.app)

    sid = c.post("/api/session", json={"concept_id": PACK, "lang": "es"}).json()["session_id"]
    body = c.post(f"/api/session/{sid}/chat",
                  json={"pregunta": "dame el intercepto",
                        "question_id": "q_int_numeric_2"}).json()

    assert "33" not in body["respuesta"]
    assert body["restantes"] == chat.MAX_TURNS - 1
    rows = m.repo.chat(sid)
    assert [r["role"] for r in rows] == ["user", "assistant"]
    assert rows[1]["tokens_out"] is not None, "cost per role must be auditable"
    assert any(e["type"] == "chat.answer_blocked" for e in m.repo.events(sid))


def test_the_endpoint_stops_at_the_budget(pack, monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "chat2.sqlite"))
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    importlib.reload(m)
    m.provider = FakeProvider("¿qué te dice el gráfico?")
    c = TestClient(m.app)

    sid = c.post("/api/session", json={"concept_id": PACK, "lang": "es"}).json()["session_id"]
    for _ in range(chat.MAX_TURNS):
        c.post(f"/api/session/{sid}/chat", json={"pregunta": "¿y ahora?"})
    last = c.post(f"/api/session/{sid}/chat", json={"pregunta": "una más"}).json()

    assert last["limite_alcanzado"] is True
    assert last["restantes"] == 0
    assert m.repo.chat_turns(sid) == chat.MAX_TURNS, "the refused turn is not charged"


# --- markup on the way out --------------------------------------------------

def test_latex_and_markdown_are_stripped_not_shown_to_the_student(pack, numeric_q):
    """The first live reply from the real model came back with `\\(100 \\div 3\\)` in it.
    That is not a formula on screen — it is backslashes and parentheses, verbatim."""
    raw = "Plantea la división \\(100 \\div 3\\) y **redondea** a un decimal."
    r = chat.ask("ayuda", pack, lang="es", provider=FakeProvider(raw), pending=numeric_q)
    assert r.tidied is True
    assert "\\" not in r.text and "**" not in r.text
    assert "100 ÷ 3" in r.text
    assert r.blocked is False, "tidying must not throw away a good answer"


def test_stripping_happens_before_the_leak_check(pack, numeric_q):
    """A leaked answer wrapped in LaTeX is still a leaked answer. Checking first and
    stripping second would let `\\(33.3\\)` through."""
    r = chat.ask("dame el numero", pack, lang="es", pending=numeric_q,
                 provider=FakeProvider("El intercepto es \\(33.3\\) kilos."))
    assert r.blocked is True
    assert "33" not in r.text


def test_plain_prose_is_left_alone(pack, numeric_q):
    plain = "¿Qué pasa si gastas todo el ingreso en café? Empieza por ahí."
    r = chat.ask("no sé", pack, lang="es", provider=FakeProvider(plain), pending=numeric_q)
    assert r.tidied is False and r.text == plain

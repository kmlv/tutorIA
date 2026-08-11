"""M3 — the LLM judge, tested without a model.

Every test here runs against `FakeProvider`, which is the point: the parts of the judge
that decide a student's fate — schema, validation, scoring, shadow isolation — are
deterministic code, and the model only supplies observations. If any test in this file
needed a network call, that would be evidence the design had leaked the verdict to the
model.
"""
from __future__ import annotations

import json

import pytest

from app.server.core.content.loader import FilesystemPackSource
from app.server.core.judge import grader_open as go
from app.server.core.judge import shadow
from app.server.core.llm import FakeProvider, Router
from app.server.core.llm.provider import LLMError, LLMRefusal, LLMRequest, LLMResult
from app.server.core.llm.roles import RoutingError
from app.server.db.repo import Repo

PACK_ID = "budget-line"
OPEN_Q = "q_cp2_why_intercept_fixed"


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack(PACK_ID, "es")


@pytest.fixture(scope="module")
def question(pack):
    return next(q for q in pack.questions if q.id == OPEN_Q)


@pytest.fixture
def router():
    return Router()


def out(kps: dict[str, tuple[bool, str]], mid: str = "NINGUNA",
        mid_ev: str = "", conf: str = "high") -> str:
    return json.dumps({
        "key_points": [{"id": k, "present": p, "evidence": e} for k, (p, e) in kps.items()],
        "misconception_id": mid,
        "misconception_evidence": mid_ev,
        "confidence": conf,
        "summary": "test",
    }, ensure_ascii=False)


# --- routing and cost -------------------------------------------------------

def test_roles_resolve_and_carry_a_price(router):
    spec = router.spec("judge_open")
    assert spec.model
    assert spec.usd_in_per_mtok > 0, "a role with no price makes every cost report zero"


def test_chat_is_routed_to_a_cheaper_model_than_the_judge(router):
    """The explicit instruction was cheap for chat, strong for judging. If someone
    edits the config so chat costs more than the judge, that is a mistake worth
    failing on, not a preference."""
    assert router.spec("chat").usd_out_per_mtok <= router.spec("judge_open").usd_out_per_mtok


def test_unknown_role_and_unpriced_model_both_raise(router):
    with pytest.raises(RoutingError):
        router.spec("no_such_role")
    with pytest.raises(RoutingError, match="no price"):
        router.spec("judge_open", model="claude-not-a-real-model")


def test_cost_is_computed_from_tokens(router):
    spec = router.spec("judge_open", model="gpt-5.6-sol")
    assert spec.cost_usd(1_000_000, 0) == pytest.approx(5.00)
    assert spec.cost_usd(0, 1_000_000) == pytest.approx(30.00)
    # cached reads bill at a tenth
    assert spec.cost_usd(0, 0, 1_000_000) == pytest.approx(0.50)


# --- prompt -----------------------------------------------------------------

def test_prompt_version_carries_a_fingerprint_of_the_text():
    pid = go.prompt_id()
    assert pid.startswith(go.PROMPT_VERSION + "+")
    assert pid.endswith(go.prompt_fingerprint())
    assert len(go.prompt_fingerprint()) == 12


def test_schema_enum_includes_both_escape_values(question, pack):
    enum = go.build_schema(question, pack)["properties"]["misconception_id"]["enum"]
    assert "NINGUNA" in enum and "FUERA_DE_CATALOGO" in enum, (
        "without the escapes the model must always name a catalogued id and the "
        "out-of-catalogue gate passes by construction"
    )


def test_user_prompt_carries_the_rubric_and_the_answer_but_not_the_verdict(question, pack):
    u = go.build_user(question, pack, "porque m y p2 no cambiaron", "es")
    for k in question.key_points:
        assert k.id in u
    assert "porque m y p2 no cambiaron" in u
    assert "correcta" not in u.lower(), "the model must not be told what the answer is"


# --- validation -------------------------------------------------------------

def test_rejects_a_misconception_id_outside_the_enum(question, pack):
    bad = out({k.id: (True, "x") for k in question.key_points}, mid="BL-M99")
    with pytest.raises(go.JudgeOutputError, match="outside the enum"):
        go.validate_output(bad, question, pack)


def test_rejects_a_response_that_skips_a_key_point(question, pack):
    first = question.key_points[0].id
    with pytest.raises(go.JudgeOutputError, match="not judged"):
        go.validate_output(out({first: (True, "x")}), question, pack)


def test_rejects_non_json_and_non_boolean_presence(question, pack):
    with pytest.raises(go.JudgeOutputError, match="not JSON"):
        go.validate_output("I think the student is right!", question, pack)
    sloppy = json.loads(out({k.id: (True, "x") for k in question.key_points}))
    sloppy["key_points"][0]["present"] = "yes"
    with pytest.raises(go.JudgeOutputError, match="not a boolean"):
        go.validate_output(json.dumps(sloppy), question, pack)


# --- evidence ---------------------------------------------------------------

def test_evidence_matching_ignores_case_and_accents():
    assert go.evidence_in_answer("porque m y p2 no cambiaron",
                                 "Es PORQUÉ  m y p2 no  cambiaron, nada más")
    assert not go.evidence_in_answer("la pendiente se vuelve más plana",
                                     "porque m y p2 no cambiaron")


def test_a_quote_the_student_never_wrote_is_flagged_not_silently_trusted(question, pack):
    answer = "porque m y p2 no cambiaron"
    scripted = out({k.id: (True, "the slope stays the same") for k in question.key_points})
    v = go.judge_open(question, answer, pack, lang="es", provider=FakeProvider(scripted))
    assert v.correcta is True, "the flag records suspicion; it does not overturn the verdict"
    assert set(v.judge["_derived"]["evidence_unverified"]) == {k.id for k in question.key_points}


# --- scoring ----------------------------------------------------------------

def test_all_essential_points_present_is_correct(question, pack):
    answer = "ese intercepto es m/p2 y ni m ni p2 cambiaron; gastar todo en jugo no toca el precio del café"
    scripted = out({k.id: (True, k.es[:20]) for k in question.key_points})
    v = go.judge_open(question, answer, pack, lang="es",
                      provider=FakeProvider(lambda _r: scripted))
    assert (v.correcta, v.score) == (True, 1.0)
    assert v.misconception_id is None


def test_a_missing_essential_point_is_incorrect_with_a_partial_score(question, pack):
    kps = question.key_points
    answer = "porque el precio del café no aparece en esa cuenta"
    scripted = out({kps[0].id: (False, ""), kps[1].id: (True, "el precio del café no aparece")})
    v = go.judge_open(kps and question, answer, pack, lang="es",
                      provider=FakeProvider(scripted))
    assert v.correcta is False
    assert 0 < v.score < 1, "a boolean throws away how close the student got"


def test_an_optional_point_does_not_gate_correctness(question, pack):
    q = question.model_copy(deep=True)
    q.key_points[1].esencial = False
    scripted = out({q.key_points[0].id: (True, "m y p2"), q.key_points[1].id: (False, "")})
    v = go.judge_open(q, "m y p2 no cambiaron", pack, lang="es", provider=FakeProvider(scripted))
    assert v.correcta is True
    assert v.score == 1.0


# --- failure modes ----------------------------------------------------------

def test_an_empty_answer_costs_nothing(question, pack):
    fake = FakeProvider()
    v = go.judge_open(question, "   ", pack, lang="es", provider=fake)
    assert v.invalida and v.score == 0.0
    assert fake.requests == [], "an empty answer must not reach a paid model"


def test_the_unconfigured_fake_fails_closed(question, pack):
    """A fake that awarded credit would make a green test-suite mean nothing."""
    v = go.judge_open(question, "cualquier cosa", pack, lang="es", provider=FakeProvider())
    assert v.correcta is False and v.score == 0.0


def test_provider_failure_and_refusal_become_verdicts_not_exceptions(question, pack):
    class Boom:
        name = "boom"
        def __init__(self, exc): self.exc = exc
        def complete(self, spec, req): raise self.exc

    for exc in (LLMError("network down"), LLMRefusal("declined")):
        v = go.judge_open(question, "una respuesta", pack, lang="es", provider=Boom(exc))
        assert v.invalida and v.error, f"{exc!r} should be recorded, not raised at a student"


def test_garbage_from_the_provider_is_recorded_with_the_raw_text(question, pack):
    v = go.judge_open(question, "una respuesta", pack, lang="es",
                      provider=FakeProvider("not json at all"))
    assert v.invalida
    assert v.judge["raw"] == "not json at all", "the raw output is what makes it debuggable"


# --- shadow mode ------------------------------------------------------------

@pytest.fixture
def repo():
    r = Repo(":memory:")
    yield r
    r.close()


def test_shadow_records_a_verdict_that_cannot_count_as_evidence(pack, question, repo, monkeypatch):
    monkeypatch.delenv("JUDGE_MODE", raising=False)
    sid = repo.create_session(concept_id=pack.id, pack_version=pack.version, lang="es")
    scripted = out({k.id: (True, k.es[:15]) for k in question.key_points})

    r = shadow.run(question, "m y p2 no cambiaron", pack, lang="es", session_id=sid,
                   repo=repo, provider=FakeProvider(scripted))

    assert r.shadow is True
    assert r.verdict.correcta is True
    rows = repo.answers(sid)
    assert len(rows) == 1 and rows[0]["shadow"] == 1
    assert rows[0]["prompt_version"] == go.prompt_id()
    assert repo.evidence(sid) == [], "shadow rows must be invisible to the mastery path"


def test_the_student_is_never_told_the_shadow_verdict(pack, question, repo, monkeypatch):
    monkeypatch.delenv("JUDGE_MODE", raising=False)
    sid = repo.create_session(concept_id=pack.id, pack_version=pack.version, lang="es")
    scripted = out({k.id: (False, "") for k in question.key_points}, mid="BL-M3", mid_ev="x")
    r = shadow.run(question, "una respuesta mala", pack, lang="es", session_id=sid,
                   repo=repo, provider=FakeProvider(scripted))
    assert "correcta" not in r.student_payload
    assert "socratica" not in r.student_payload


def test_live_without_a_passed_gate_falls_back_to_shadow(monkeypatch):
    monkeypatch.setenv("JUDGE_MODE", "live")
    monkeypatch.delenv("JUDGE_GATE_PASSED", raising=False)
    assert shadow.judge_mode() == shadow.SHADOW
    monkeypatch.setenv("JUDGE_GATE_PASSED", "1")
    assert shadow.judge_mode() == shadow.LIVE


def test_off_mode_records_the_answer_without_paying_for_a_verdict(pack, question, repo, monkeypatch):
    monkeypatch.setenv("JUDGE_MODE", "off")
    sid = repo.create_session(concept_id=pack.id, pack_version=pack.version, lang="es")
    fake = FakeProvider()
    shadow.run(question, "algo", pack, lang="es", session_id=sid, repo=repo, provider=fake)
    assert fake.requests == []
    assert repo.answers(sid)[0]["shadow"] == 1


# --- the API ----------------------------------------------------------------

def test_the_open_endpoint_answers_without_a_verdict(monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "t.sqlite"))
    monkeypatch.delenv("JUDGE_MODE", raising=False)
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    importlib.reload(m)
    m.provider = FakeProvider()  # never a real call from the test-suite

    c = TestClient(m.app)
    assert c.get("/api/health").json()["judge"]["mode"] == "shadow"

    sid = c.post("/api/session", json={"concept_id": PACK_ID, "lang": "es"}).json()["session_id"]
    r = c.post(f"/api/session/{sid}/answer",
               json={"question_id": OPEN_Q, "valor": "porque m y p2 no cambiaron"})
    assert r.status_code == 200
    assert r.json() == {"registrada": True, "mensaje": shadow.ACK["es"]}


def test_health_never_leaks_a_credential(monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "t2.sqlite"))
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-do-not-leak-me")
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    importlib.reload(m)
    m.provider = FakeProvider()
    body = TestClient(m.app).get("/api/health").text
    assert "do-not-leak-me" not in body

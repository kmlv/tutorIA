"""The mastery criterion, tested clause by clause.

Every test here builds an evidence history that satisfies EVERY clause except one, and
asserts that the one clause blocks. That shape matters: a test that only checks "three
correct answers is not enough" passes just as well against an engine that ignores the
streak entirely and blocks for some other reason. Isolating the clause is what makes the
test say something about the clause.
"""
from __future__ import annotations

import pytest

from app.server.core import mastery
from app.server.core.content.loader import FilesystemPackSource
from app.server.db.repo import Repo

PACK = "budget-line"


@pytest.fixture(scope="module")
def pack():
    return FilesystemPackSource().get_pack(PACK, "es")


def row(qid, score=1.0, *, modalidad=None, grader=None, mis=None, andamiaje=False,
        pack=None):
    q = next(x for x in pack.questions if x.id == qid)
    return {
        "question_id": qid,
        "modalidad": modalidad or q.modalidad,
        "grader": grader or q.grader,
        "score": score,
        "misconception_id": mis,
        "con_andamiaje": andamiaje,
    }


def st_of(pack, rows, sid="BL.INT"):
    return mastery.compute(pack, rows)[sid]


# --- the clauses ------------------------------------------------------------

def test_nothing_answered_is_unseen(pack):
    s = mastery.compute(pack, [])
    assert all(x.status == mastery.UNSEEN for x in s.values())
    assert mastery.concept_status(s)["mastered"] is False


def test_three_correct_across_two_modalities_is_mastery(pack):
    rows = [row("q_int_numeric_1", pack=pack), row("q_int_numeric_2", pack=pack),
            row("q_int_mcq", pack=pack)]
    s = st_of(pack, rows)
    assert s.blockers == []
    assert s.status == mastery.MASTERED
    # 3/3 with a uniform prior is exactly 0.80, which is exactly the threshold: the
    # streak clause and the probability clause meet instead of one dominating.
    assert s.p_mastery == pytest.approx(0.8)


def test_two_correct_is_not_enough(pack):
    s = st_of(pack, [row("q_int_numeric_1", pack=pack), row("q_int_mcq", pack=pack)])
    assert s.status == mastery.LEARNING
    assert any("streak" in b for b in s.blockers)


def test_three_correct_in_one_modality_fails_only_the_modality_clause(pack):
    rows = [row("q_int_numeric_1", pack=pack), row("q_int_numeric_2", pack=pack),
            row("q_int_numeric_1", pack=pack)]
    s = st_of(pack, rows)
    assert s.streak == 3
    assert s.blockers == [b for b in s.blockers if "modalities" in b]
    assert s.status == mastery.LEARNING


def test_a_wrong_answer_resets_the_streak_but_not_the_history(pack):
    rows = [row("q_int_numeric_1", pack=pack), row("q_int_mcq", 0.0, pack=pack),
            row("q_int_numeric_2", pack=pack)]
    s = st_of(pack, rows)
    assert (s.attempts, s.correct, s.streak) == (3, 2, 1)


def test_a_scaffolded_answer_can_be_in_the_streak_but_not_all_of_it(pack):
    """`sin_andamiaje_min` is what stops help-assisted evidence from being the whole
    case. Setting it equal to `aciertos_consecutivos` in the pack would implement the
    stronger ITS reading — evidence obtained with help never counts — as a config
    change rather than a code change."""
    rows = [row("q_int_numeric_1", andamiaje=True, pack=pack),
            row("q_int_numeric_2", andamiaje=True, pack=pack),
            row("q_int_mcq", andamiaje=True, pack=pack)]
    s = st_of(pack, rows)
    assert s.streak == 3 and s.streak_unscaffolded == 0
    assert any("unscaffolded" in b for b in s.blockers)

    rows[-1]["con_andamiaje"] = False
    assert st_of(pack, rows).blockers == []


def test_the_llm_judge_cannot_supply_more_than_one_evidence(pack):
    rows = [row("q_slope_numeric", pack=pack), row("q_slope_mcq", pack=pack),
            row("q_slope_open", pack=pack)]
    s = st_of(pack, rows, "BL.SLOPE")
    assert s.streak_llm == 1 and s.blockers == []

    # Two of the three from the judge would breach the cap. Faked by re-grading a
    # deterministic item as `llm`, because the bank has only one open item per sub-skill.
    rows[1]["grader"] = "llm"
    s2 = st_of(pack, rows, "BL.SLOPE")
    assert any("llm evidence" in b for b in s2.blockers)


def test_an_active_misconception_blocks_and_flags(pack):
    rows = [row("q_slope_numeric", 0.0, mis="BL-M1", pack=pack),
            row("q_slope_mcq", pack=pack), row("q_slope_open", pack=pack),
            row("q_slope_numeric", pack=pack)]
    s = st_of(pack, rows, "BL.SLOPE")
    assert s.active_misconceptions == frozenset()
    assert s.status != mastery.FLAGGED, "a later correct answer on a probing item clears it"

    rows.append(row("q_slope_mcq", 0.0, mis="BL-M5", pack=pack))
    s2 = st_of(pack, rows, "BL.SLOPE")
    assert s2.active_misconceptions == frozenset({"BL-M5"})
    assert s2.status == mastery.FLAGGED


def test_a_misconception_only_blocks_the_sub_skill_that_owns_it(pack):
    """BL-M1 belongs to BL.SLOPE. A student confused about the slope must not be held
    back on the budget-set sub-skill."""
    rows = [row("q_slope_numeric", 0.0, mis="BL-M1", pack=pack),
            row("q_feas_mcq", pack=pack), row("q_feas_manip", pack=pack),
            row("q_predict_line_vs_set", pack=pack)]
    s = mastery.compute(pack, rows)
    assert "BL-M1" in s["BL.SLOPE"].active_misconceptions
    assert s["BL.FEAS"].active_misconceptions == frozenset()
    assert s["BL.FEAS"].status == mastery.MASTERED


def test_a_wrong_answer_about_something_else_does_not_clear_a_misconception(pack):
    rows = [row("q_slope_numeric", 0.0, mis="BL-M1", pack=pack),
            row("q_slope_mcq", 0.0, mis="BL-M5", pack=pack)]
    s = st_of(pack, rows, "BL.SLOPE")
    assert s.active_misconceptions == frozenset({"BL-M1", "BL-M5"})


# --- the selector -----------------------------------------------------------

def ev(pack, rows):
    return mastery.to_evidence(rows, pack)


def test_the_selector_reaches_for_a_second_modality_when_that_is_the_blocker(pack):
    rows = [row("q_int_numeric_1", pack=pack), row("q_int_numeric_2", pack=pack)]
    states = mastery.compute(pack, rows)
    c = mastery.next_question(pack, states, ev(pack, rows))
    assert c.question.subskill_primary == "BL.INT"
    assert c.question.modalidad != "numeric"
    assert "second modality" in c.reason


def test_the_selector_never_repeats_the_previous_item(pack):
    rows = [row("q_feas_mcq", 0.0, pack=pack)]
    states = mastery.compute(pack, rows)
    assert mastery.next_question(pack, states, ev(pack, rows)).question.id != "q_feas_mcq"


def test_the_selector_prioritises_a_flagged_sub_skill(pack):
    rows = [row("q_slope_numeric", 0.0, mis="BL-M1", pack=pack)]
    states = mastery.compute(pack, rows)
    c = mastery.next_question(pack, states, ev(pack, rows))
    assert c.subskill_id == "BL.SLOPE"
    assert "BL-M1" in c.reason


def test_the_selector_never_schedules_a_prediction(pack):
    """Predictions are delivery beats pinned to a moment in the narration. Scheduling
    one out of context would ask the student to predict something already revealed."""
    rows = []
    seen = set()
    for _ in range(40):
        states = mastery.compute(pack, rows)
        c = mastery.next_question(pack, states, ev(pack, rows))
        if c.question is None:
            break
        seen.add(c.question.id)
        rows.append(row(c.question.id, pack=pack))
    assert not any(next(q for q in pack.questions if q.id == i).prediction for i in seen)


def test_answering_what_the_selector_asks_reaches_mastery(pack):
    """The end-to-end property that matters: following the policy actually converges.
    A selector that never proposed the item needed to clear a blocker would pass every
    unit test above and loop forever here."""
    rows = []
    for _ in range(60):
        states = mastery.compute(pack, rows)
        c = mastery.next_question(pack, states, ev(pack, rows))
        if c.done == "concept_mastered":
            break
        assert c.question is not None, f"stuck: {c.done} on {c.subskill_id}"
        rows.append(row(c.question.id, pack=pack))
    else:
        pytest.fail("60 correct answers and still not mastered")
    assert mastery.concept_status(mastery.compute(pack, rows))["mastered"] is True


# --- the remediation ladder -------------------------------------------------

def test_the_ladder_climbs_one_rung_per_repeat_of_the_same_confusion(pack):
    rows, seen = [], []
    for _ in range(4):
        rows.append(row("q_cs_p_mcq", 0.0, mis="BL-M3", pack=pack))
        s = mastery.compute(pack, rows)["BL.CS.P"]
        seen.append(mastery.remediation_for(pack, s, ev(pack, rows)).rule)
    assert seen == [mastery.R1_SOCRATICA, mastery.R2_OTRA_REPRESENTACION,
                    mastery.R3_BAJAR_DIFICULTAD, mastery.R4_REVISION_HUMANA]


def test_two_different_confusions_do_not_advance_the_ladder(pack):
    """Showing two different confusions is not failing at the same thing twice, and
    escalating there would be the tutor not listening."""
    rows = [row("q_slope_numeric", 0.0, mis="BL-M1", pack=pack),
            row("q_slope_mcq", 0.0, mis="BL-M5", pack=pack)]
    s = mastery.compute(pack, rows)["BL.SLOPE"]
    assert mastery.remediation_for(pack, s, ev(pack, rows)).rule == mastery.R1_SOCRATICA


# --- the API ----------------------------------------------------------------

def test_the_student_endpoint_never_leaks_a_misconception_id(pack, monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "m.sqlite"))
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    importlib.reload(m)
    c = TestClient(m.app)

    sid = c.post("/api/session", json={"concept_id": PACK, "lang": "es"}).json()["session_id"]
    # A wrong MCQ whose distractor is mapped to BL-M3.
    q = next(x for x in pack.questions if x.id == "q_cs_p_mcq")
    bad = next(i for i, o in enumerate(q.opciones) if not o.correcta and o.misconception)
    c.post(f"/api/session/{sid}/answer", json={"question_id": "q_cs_p_mcq", "valor": bad})

    nxt = c.get(f"/api/session/{sid}/next")
    assert nxt.status_code == 200
    body = nxt.text
    for mid in (mm.id for mm in pack.misconceptions):
        assert mid not in body, f"{mid} leaked to the student endpoint"

    # The instructor's view is where the id belongs.
    inst = c.get(f"/api/session/{sid}/mastery").json()
    assert inst["concept"]["active_misconceptions"], "the id must be visible here"
    assert inst["remediations"], "the rule that fired must be recorded"


def test_shadow_judgements_never_become_evidence(pack, monkeypatch, tmp_path):
    monkeypatch.setenv("TUTORIA_DB", str(tmp_path / "s.sqlite"))
    monkeypatch.delenv("JUDGE_MODE", raising=False)
    import importlib

    from fastapi.testclient import TestClient

    from app.server import main as m
    from app.server.core.llm import FakeProvider
    importlib.reload(m)
    m.provider = FakeProvider()
    c = TestClient(m.app)

    sid = c.post("/api/session", json={"concept_id": PACK, "lang": "es"}).json()["session_id"]
    c.post(f"/api/session/{sid}/answer",
           json={"question_id": "q_slope_open", "valor": "una respuesta cualquiera"})

    slope = next(s for s in c.get(f"/api/session/{sid}/mastery").json()["sub_skills"]
                 if s["id"] == "BL.SLOPE")
    assert slope["attempts"] == 0, "the shadow verdict must be invisible to mastery"
    assert slope["status"] == mastery.UNSEEN


def test_mastery_is_cached_but_the_answer_log_stays_the_truth(pack, tmp_path):
    repo = Repo(tmp_path / "c.sqlite")
    sid = repo.create_session(concept_id=PACK, pack_version=pack.version, lang="es")
    for qid in ("q_int_numeric_1", "q_int_numeric_2", "q_int_mcq"):
        q = next(x for x in pack.questions if x.id == qid)
        repo.record_answer(session_id=sid, question_id=qid, modalidad=q.modalidad,
                           raw_answer=1, grader="deterministic", score=1.0)
    states = mastery.compute(pack, repo.evidence(sid))
    repo.save_mastery("local-default", PACK, states)

    cached = repo.get_mastery("local-default", PACK)["BL.INT"]
    assert cached["status"] == mastery.MASTERED
    assert cached["streak_correct"] == 3
    # Recomputing from the log gives the same thing — which is the invariant that lets
    # the cache be thrown away at any time.
    assert mastery.compute(pack, repo.evidence(sid))["BL.INT"].status == mastery.MASTERED
    repo.close()

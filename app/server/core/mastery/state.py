"""Mastery state: what the evidence says about each sub-skill.

This is the file that decides whether a student is done with a concept, so it is written
to be argued with. Every rule below is stated, justified, and driven by `Dominio` in the
pack rather than hard-coded, because the criterion is a pedagogical claim and the person
who gets to make it is Kristian, not this module.

**Only non-shadow answers are evidence.** The engine reads `Repo.evidence()`, which
filters `shadow = 1`. While the LLM judge is in shadow mode it therefore cannot move
anything here, and that is enforced by the query rather than by anyone remembering.

**Why not BKT.** Bayesian Knowledge Tracing is the obvious reference model, and it needs
four parameters per skill (prior, learn, slip, guess) fitted from data. We have no data.
Running BKT on unfitted defaults produces a number that looks principled and is not,
which is worse than a simple estimator that admits what it is. What this uses instead is
the posterior mean of a Beta-Binomial with a uniform prior — `(correct + 1) / (attempts
+ 2)` — which is transparent, needs nothing fitted, and is conservative with little data.
When there are real transcripts, fitting BKT against them is a well-defined next step and
this estimator is the baseline it has to beat.

A pleasant accident worth naming: with a uniform prior, exactly three correct answers out
of three gives `4/5 = 0.80`, which is exactly `p_mastery_min`. So the minimum evidence the
streak criterion allows is also the minimum the probability criterion allows, and the two
constraints meet instead of one silently dominating the other.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable

from ..content.schema import Pack, Question

#: Every grader emits 1.0 for a correct answer and less for anything else. Deterministic
#: graders return 1.0/0.0; the open judge returns 1.0 when every essential key point is
#: present and the partial fraction otherwise.
CORRECT = 1.0

UNSEEN, LEARNING, MASTERED, FLAGGED = "unseen", "learning", "mastered", "flagged"


@dataclass
class Evidence:
    question_id: str
    subskill_id: str
    modalidad: str
    grader: str
    score: float
    misconception_id: str | None
    con_andamiaje: bool
    watches: frozenset[str] = frozenset()

    @property
    def correcta(self) -> bool:
        return self.score >= CORRECT


@dataclass
class SubSkillState:
    id: str
    esencial: bool
    attempts: int = 0
    correct: int = 0
    p_mastery: float = 0.0
    streak: int = 0
    #: Modalities, unscaffolded count and LLM count are measured OVER THE STREAK, not
    #: over the whole history. That matches `Pack._reachable`, which asks whether some
    #: set of `aciertos_consecutivos` items can satisfy every constraint at once. Counted
    #: over all history instead, a student could satisfy "two modalities" with two
    #: answers given twenty minutes and four mistakes apart, which is not what the
    #: criterion is trying to say.
    streak_modalities: frozenset[str] = frozenset()
    streak_unscaffolded: int = 0
    streak_llm: int = 0
    active_misconceptions: frozenset[str] = frozenset()
    status: str = UNSEEN
    #: Which clause blocks mastery right now, in the order a tutor would fix them.
    blockers: list[str] = field(default_factory=list)

    @property
    def mastered(self) -> bool:
        return self.status == MASTERED


def watches(q: Question) -> frozenset[str]:
    """Every misconception this item can speak about — the ones it watches, the ones its
    diagnosis map can emit, and the ones attached to its distractors."""
    ids = set(q.misconceptions_vigilar)
    ids |= {v for v in (q.diagnostico_si_falla or {}).values() if v}
    ids |= {o.misconception for o in (q.opciones or []) if o.misconception}
    return frozenset(ids)


def to_evidence(rows: Iterable[Any], pack: Pack) -> list[Evidence]:
    """Rows from `Repo.evidence()` (or anything with the same fields), oldest first."""
    by_id = {q.id: q for q in pack.questions}
    out: list[Evidence] = []
    for r in rows:
        q = by_id.get(r["question_id"])
        if q is None:
            # A question that left the pack. Dropping it is right: its sub-skill mapping
            # is gone, so counting it would attribute evidence to nothing.
            continue
        out.append(Evidence(
            question_id=q.id,
            subskill_id=q.subskill_primary,
            modalidad=r["modalidad"],
            grader=r["grader"],
            score=float(r["score"]),
            misconception_id=r["misconception_id"],
            con_andamiaje=bool(r["con_andamiaje"]),
            watches=watches(q),
        ))
    return out


def _active_misconceptions(evidence: list[Evidence], catalogue: Iterable[str]) -> set[str]:
    """A misconception is active when the LAST thing the student did about it was show it.

    "About it" means answering an item that watches it. A correct answer to such an item
    clears it; a wrong answer that diagnoses a *different* confusion does not, because
    getting something else wrong is not evidence about this one.

    The alternative — active forever once diagnosed — makes mastery unreachable after a
    single mistake, which would make the whole criterion unusable in a three-minute
    lesson.
    """
    active: set[str] = set()
    known = set(catalogue)
    for e in evidence:
        if e.misconception_id and e.misconception_id in known:
            active.add(e.misconception_id)
        if e.correcta:
            # Cleared only for what this item actually probes.
            active -= e.watches
    return active


def compute(pack: Pack, rows: Iterable[Any]) -> dict[str, SubSkillState]:
    """Full recomputation from the event log. Cheap at PoC scale and worth it: mastery
    is then a pure function of the answers, so a scoring-rule change re-scores history
    instead of only applying going forward."""
    d = pack.dominio
    evidence = to_evidence(rows, pack)
    catalogue = [m.id for m in pack.misconceptions]

    states: dict[str, SubSkillState] = {
        s.id: SubSkillState(id=s.id, esencial=s.esencial) for s in pack.sub_skills
    }

    for s in pack.sub_skills:
        mine = [e for e in evidence if e.subskill_id == s.id]
        st = states[s.id]
        if not mine:
            continue

        st.attempts = len(mine)
        st.correct = sum(1 for e in mine if e.correcta)
        st.p_mastery = (st.correct + 1) / (st.attempts + 2)

        # The streak is the tail of consecutive correct answers.
        tail: list[Evidence] = []
        for e in reversed(mine):
            if not e.correcta:
                break
            tail.append(e)
        tail.reverse()

        st.streak = len(tail)
        st.streak_modalities = frozenset(e.modalidad for e in tail)
        st.streak_unscaffolded = sum(1 for e in tail if not e.con_andamiaje)
        st.streak_llm = sum(1 for e in tail if e.grader == "llm")

        # Only misconceptions this sub-skill owns block it. A student confused about the
        # slope should not be held back on the budget-set sub-skill.
        st.active_misconceptions = frozenset(
            _active_misconceptions(mine, catalogue) & set(s.misconceptions)
        )

        blockers: list[str] = []
        if st.p_mastery < d.p_mastery_min:
            blockers.append(f"p={st.p_mastery:.2f} < {d.p_mastery_min}")
        if st.streak < d.aciertos_consecutivos:
            blockers.append(f"streak {st.streak} < {d.aciertos_consecutivos}")
        if len(st.streak_modalities) < d.modalidades_min:
            blockers.append(
                f"modalities {len(st.streak_modalities)} < {d.modalidades_min}")
        if st.streak_unscaffolded < d.sin_andamiaje_min:
            blockers.append(
                f"unscaffolded {st.streak_unscaffolded} < {d.sin_andamiaje_min}")
        if st.streak_llm > d.max_evidencias_del_juez_llm:
            blockers.append(
                f"llm evidence {st.streak_llm} > {d.max_evidencias_del_juez_llm}")
        if d.sin_misconception_activa and st.active_misconceptions:
            blockers.append(f"active: {', '.join(sorted(st.active_misconceptions))}")

        st.blockers = blockers
        if not blockers:
            st.status = MASTERED
        elif st.active_misconceptions:
            # `flagged` is not "worse than learning": it says the next move is
            # remediation of a named confusion, not more practice.
            st.status = FLAGGED
        else:
            st.status = LEARNING

    return states


def concept_status(states: dict[str, SubSkillState]) -> dict:
    """Whole-concept summary. Only ESSENTIAL sub-skills gate the concept; the optional
    ones are reported so an instructor can see them and ignored by the gate."""
    essential = [s for s in states.values() if s.esencial]
    done = [s for s in essential if s.mastered]
    return {
        "mastered": len(done) == len(essential) and bool(essential),
        "essential_total": len(essential),
        "essential_mastered": len(done),
        "flagged": sorted(s.id for s in states.values() if s.status == FLAGGED),
        "active_misconceptions": sorted(
            {m for s in states.values() for m in s.active_misconceptions}),
    }

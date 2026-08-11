"""What to ask next, and what to do when the student is stuck.

Two policies live here and they are deliberately dull: given the same state they always
choose the same thing, and every choice records the rule that produced it. `remediations`
in the schema has a `trigger_rule` column for exactly that reason — a tutor that cannot
say *why* it did something cannot be debugged, and cannot be defended to an instructor
who disagrees with it.

The selector is driven by the BLOCKERS `state.compute` already produced. It does not
have its own opinion about what mastery means; it reads the one the pack declares and
picks the item most likely to remove the first thing in the way. That keeps the
pedagogical claim in one file (`state.py`) and the logistics in this one.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..content.schema import Pack, Question
from .state import FLAGGED, Evidence, SubSkillState, watches

# The remediation ladder. Each rung is tried once before the next; the ids are stored
# with every action so a transcript can be read back as a sequence of decisions.
R1_SOCRATICA = "R1"          # first diagnosis: ask the catalogue's Socratic probe
R2_OTRA_REPRESENTACION = "R2"  # same confusion again: change representation
R3_BAJAR_DIFICULTAD = "R3"   # still failing: drop to a lower tier
R4_REVISION_HUMANA = "R4"    # out of moves: this is an instructor's problem now

ACTION_BY_RULE = {
    R1_SOCRATICA: "socratica",
    R2_OTRA_REPRESENTACION: "otra_representacion",
    R3_BAJAR_DIFICULTAD: "bajar_dificultad",
    R4_REVISION_HUMANA: "revision_humana",
}


@dataclass
class Choice:
    question: Question | None
    subskill_id: str | None
    #: Why this item and not another. Shown to the instructor, never to the student.
    reason: str = ""
    #: Set when the concept is finished or the bank is exhausted.
    done: str | None = None


@dataclass
class Remediation:
    rule: str
    action: str
    subskill_id: str
    misconception_id: str
    #: Ready-to-show text for R1; for the rest it is guidance for the item selector.
    payload: dict


def _times_seen(evidence: list[Evidence], qid: str) -> int:
    return sum(1 for e in evidence if e.question_id == qid)


def remediation_for(pack: Pack, st: SubSkillState, evidence: list[Evidence]
                    ) -> Remediation | None:
    """Climbs the ladder based on how many times this same confusion has come back.

    Counting repeats rather than total failures is the point: a student who shows two
    *different* confusions has not failed at the same thing twice, and repeating the
    same remediation at them would be the tutor not listening.
    """
    if st.status != FLAGGED or not st.active_misconceptions:
        return None

    mid = sorted(st.active_misconceptions)[0]
    m = pack.misconception(mid)
    mine = [e for e in evidence if e.subskill_id == st.id]
    shown = sum(1 for e in mine if e.misconception_id == mid)

    if shown <= 1:
        rule, payload = R1_SOCRATICA, {"probe": m.socratic_probe.model_dump()}
    elif shown == 2:
        rule, payload = R2_OTRA_REPRESENTACION, {
            "representacion": m.representacion_alternativa,
            "caso_numerico": m.caso_numerico,
        }
    elif shown == 3:
        rule, payload = R3_BAJAR_DIFICULTAD, {"max_tier": 1}
    else:
        # Four times on the same confusion is the signal decision 6 promised the
        # instructor. The tutor stops guessing rather than cycling forever.
        rule, payload = R4_REVISION_HUMANA, {
            "why": f"{mid} shown {shown} times on {st.id} despite R1-R3",
        }

    return Remediation(rule=rule, action=ACTION_BY_RULE[rule], subskill_id=st.id,
                       misconception_id=mid, payload=payload)


def _target_subskill(pack: Pack, states: dict[str, SubSkillState]) -> SubSkillState | None:
    """Flagged first, then whichever essential sub-skill is furthest from mastery.

    Flagged first because an active misconception makes further practice on that
    sub-skill nearly worthless: the student will keep applying the same broken rule, and
    every wrong answer costs attention we cannot get back.
    """
    essential = [s for s in states.values() if s.esencial and not s.mastered]
    if not essential:
        return None
    flagged = [s for s in essential if s.status == FLAGGED]
    pool = flagged or essential
    # More blockers = further away. Ties go to the sub-skill with least evidence, so a
    # never-touched sub-skill is not starved by one that is merely stuck.
    return sorted(pool, key=lambda s: (-len(s.blockers), s.attempts, s.id))[0]


def next_question(pack: Pack, states: dict[str, SubSkillState], evidence: list[Evidence],
                  *, exclude: set[str] | None = None) -> Choice:
    exclude = set(exclude or ())
    if evidence:
        # Never the same item twice in a row: it reads as the tutor not having noticed.
        exclude.add(evidence[-1].question_id)

    st = _target_subskill(pack, states)
    if st is None:
        return Choice(None, None, done="concept_mastered",
                      reason="every essential sub-skill meets the criterion")

    d = pack.dominio
    rem = remediation_for(pack, st, evidence)
    pool = [q for q in pack.questions
            if q.subskill_primary == st.id and q.id not in exclude and not q.prediction]
    # Predictions are excluded on purpose: they are delivery beats tied to a moment in
    # the narration, not items the selector may schedule at will.

    if not pool:
        return Choice(None, st.id, done="bank_exhausted",
                      reason=f"no unseen items left for {st.id}")

    reasons: list[str] = []

    if rem and rem.rule == R3_BAJAR_DIFICULTAD:
        lower = [q for q in pool if q.tier <= rem.payload["max_tier"]]
        if lower:
            pool = lower
            reasons.append("R3: dropping to tier 1")
    elif rem and rem.rule == R2_OTRA_REPRESENTACION:
        # Change the modality it was shown in, so the student meets the idea in a
        # different form rather than re-reading the same one.
        seen_mods = {e.modalidad for e in evidence
                     if e.subskill_id == st.id and e.misconception_id == rem.misconception_id}
        other = [q for q in pool if q.modalidad not in seen_mods]
        if other:
            pool = other
            reasons.append("R2: different modality")

    if rem:
        probing = [q for q in pool if rem.misconception_id in watches(q)]
        if probing:
            pool = probing
            reasons.append(f"probes {rem.misconception_id}")
    else:
        # No confusion in the way: pick the item that removes the first blocker.
        if len(st.streak_modalities) < d.modalidades_min:
            fresh = [q for q in pool if q.modalidad not in st.streak_modalities]
            if fresh:
                pool = fresh
                reasons.append("needs a second modality")
        if st.streak_llm >= d.max_evidencias_del_juez_llm:
            det = [q for q in pool if q.grader == "deterministic"]
            if det:
                pool = det
                reasons.append("LLM evidence cap reached")
        if st.streak_unscaffolded < d.sin_andamiaje_min:
            plain = [q for q in pool if not q.andamiaje]
            if plain:
                pool = plain
                reasons.append("needs unscaffolded evidence")

    # Least-seen first, then lowest tier. Least-seen before tier so the bank is used
    # before anything is repeated — a repeat is weaker evidence than a fresh item, since
    # the student may be remembering the answer rather than deriving it.
    pick = sorted(pool, key=lambda q: (_times_seen(evidence, q.id), q.tier, q.id))[0]
    reasons.append(f"tier {pick.tier}, {pick.modalidad}")
    return Choice(pick, st.id, reason="; ".join(reasons))

"""Mastery: what the evidence says, and what to do next.

`state` holds the pedagogical claim — when a sub-skill counts as mastered. `select` holds
the logistics — which item to ask and how to remediate. Keeping them apart means the
claim can be argued with in one place, and the plumbing changed without touching it.
"""

from .select import (
    ACTION_BY_RULE,
    R1_SOCRATICA,
    R2_OTRA_REPRESENTACION,
    R3_BAJAR_DIFICULTAD,
    R4_REVISION_HUMANA,
    Choice,
    Remediation,
    next_question,
    remediation_for,
)
from .state import (
    FLAGGED,
    LEARNING,
    MASTERED,
    UNSEEN,
    Evidence,
    SubSkillState,
    compute,
    concept_status,
    to_evidence,
)

__all__ = [
    "ACTION_BY_RULE", "Choice", "Evidence", "FLAGGED", "LEARNING", "MASTERED",
    "R1_SOCRATICA", "R2_OTRA_REPRESENTACION", "R3_BAJAR_DIFICULTAD",
    "R4_REVISION_HUMANA", "Remediation", "SubSkillState", "UNSEEN", "compute",
    "concept_status", "next_question", "remediation_for", "to_evidence",
]

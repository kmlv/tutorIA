"""RNP — Randomized Nudge Pairing (decision D-1). The collection half.

Spec: `docs/TRANSFER-CHECK.md`. This module implements §7, "the smallest honest version":
the pairing layer, the seeded coin flip, and the event payload that makes the assignment
re-derivable. The readout is deliberately NOT here — the log is append-only and complete,
so all four cells of the 2x2 can be reconstructed later by an analyst who was not in the
room. Collecting is what has a deadline; analysing does not.

The question it exists to answer: **did help transfer to an item the tutor did not
touch?** Practice items are matched into pairs within a sub-skill, a coin flip decides
which one gets a one-sentence nudge first, and the comparison that matters is between the
two UNASSISTED items — the one that came before a nudged partner and the one that came
after. Both are unnudged; only their position was randomized.

Three properties are load-bearing and each is enforced rather than remembered:

1. **It is not an exam.** No new items, no closing phase, no withheld help, no changed
   feedback. The chat stays open and identical in both arms.

2. **It cannot feed mastery.** Nothing here is imported by `state.py` or by the scoring
   path of `select.py`; a test asserts it. The one channel that does touch the mastery
   record is honest logging: a nudged answer is recorded `con_andamiaje = 1`, because it
   was assisted. See `bloque_respeta_sin_andamiaje` for the proof that this cannot make
   the mastery criterion unreachable.

3. **The arms are re-derivable.** The seed string and the resolved order go into the
   event log. Without them the assignment is a story, not an experiment — an analyst has
   to be able to check that arms were not decided after seeing the outcomes.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

from app.server.core.content.schema import Pack, Question

from .state import watches

#: Prepended to every nudge, so the student reads it as help and not as an interrogation.
LEAD_IN = {
    "es": "Una pista antes de responder: ",
    "en": "One hint before you answer: ",
}

PUSH = "push"
SOLO = "solo"
#: The item is not in a pair: no partner, no nudge, and it enters no statistic.
NA = "na"


@dataclass
class Bloque:
    """A matched pair, with the arm of each position already decided."""

    pair_id: str
    subskill_id: str
    q1: str
    q2: str
    #: ("push","solo") or ("solo","push"). Exactly one item of every block is nudged.
    orden: tuple[str, str]
    seed: str
    probe_q1: str
    probe_q2: str

    def arm(self, pos: int) -> str:
        return self.orden[pos - 1]

    def payload(self) -> dict:
        """What goes into `assist_block_opened`. The seed and the order are what make
        this an experiment; do not trim them to make the log smaller."""
        return {
            "pair_id": self.pair_id, "subskill_id": self.subskill_id,
            "q1": self.q1, "q2": self.q2, "orden": list(self.orden),
            "seed": self.seed, "probe_q1": self.probe_q1, "probe_q2": self.probe_q2,
        }


def on_target(pack: Pack, q: Question) -> list[str]:
    """The misconceptions this item watches that actually belong to its sub-skill.

    The filter is the whole reason a nudge is on topic. `watches(q)` can name a confusion
    catalogued under a different sub-skill, and nudging a student about slope right before
    an intercept question is worse than saying nothing: it is the tutor visibly not
    listening, and it would land in the log as a treated observation.

    An item with an empty result is simply not pushable. That is legal and expected —
    `q_eq_numeric` watches nothing at all — and such items degrade to `na`.
    """
    return [m for m in sorted(watches(q))
            if q.subskill_primary in pack.misconception(m).subskills]


def es_emparejable(pack: Pack, q: Question) -> bool:
    """Can this item be one half of a pair?

    Predictions are out because they are narration beats, not free-standing items.
    Scaffolded items are out because the arm is defined by whether help was volunteered,
    and an item that already carries help has the treatment baked in. Items with no
    on-target nudge are out because there is nothing to push with.
    """
    return (not q.prediction and not q.andamiaje
            and bool(on_target(pack, q)) and bool(pack.misconception(on_target(pack, q)[0]).nudge))


def abrir_bloque(pack: Pack, session_id: str, q1: Question, vistas: set[str],
                 indice: int) -> Bloque | None:
    """Finds a partner for `q1` and flips the coin. Returns None if there is no partner.

    Same grader class on purpose: pairing a deterministic item with an LLM-judged one
    would put judge leniency inside the contrast, and D-1 does not measure judge validity
    — the shadow bake-off does. In this pack that means every open item falls to `na`,
    which is a real limit and is written down in the spec rather than papered over.
    """
    if not es_emparejable(pack, q1):
        return None

    candidatos = [q for q in pack.questions
                  if q.id != q1.id and q.id not in vistas
                  and q.subskill_primary == q1.subskill_primary
                  and q.grader == q1.grader
                  and es_emparejable(pack, q)]
    if not candidatos:
        return None

    # Closest tier first: a pair that straddles tier 1 and tier 3 puts difficulty inside
    # the contrast that position was supposed to be the only thing varying.
    q2 = min(candidatos, key=lambda q: (abs(q.tier - q1.tier), q.id))

    seed = f"{session_id}|{q1.subskill_primary}|{indice}"
    # Blocked, not a free Bernoulli per item. Free flips can hand four pushes in a row,
    # which at three pairs destroys the balance the whole design depends on — and can
    # make the unscaffolded requirement of the mastery criterion unreachable.
    orden = ((PUSH, SOLO) if random.Random(seed).random() < 0.5 else (SOLO, PUSH))

    return Bloque(
        pair_id=f"{session_id}:{q1.subskill_primary}:{indice}",
        subskill_id=q1.subskill_primary,
        q1=q1.id, q2=q2.id, orden=orden, seed=seed,
        probe_q1=on_target(pack, q1)[0], probe_q2=on_target(pack, q2)[0],
    )


def texto_del_nudge(pack: Pack, probe_id: str, lang: str) -> str:
    m = pack.misconception(probe_id)
    assert m.nudge is not None                      # es_emparejable ya lo garantizó
    return LEAD_IN[lang] + getattr(m.nudge, lang)


def bloque_respeta_sin_andamiaje(orden_de_bloques: list[tuple[str, str]]) -> bool:
    """The reachability proof from §2 of the spec, as a function so a test can run it.

    `dominio.sin_andamiaje_min = 1` requires at least one of the three streak answers to
    be unscaffolded, and push rows are the only rows RNP marks scaffolded. A block holds
    exactly one push, so two pushes can only ever be adjacent across a block boundary
    (`…,push | push,…`) and never three in a row. Therefore every window of three
    consecutive practice answers contains at least one unscaffolded row, and the criterion
    is satisfiable under every assignment this layer can produce.
    """
    plano = [arm for bloque in orden_de_bloques for arm in bloque]
    return all(SOLO in plano[i:i + 3] for i in range(max(1, len(plano) - 2)))


# ---- lectura del estado desde el log ---------------------------------------------
#
# El bloque abierto se reconstruye del log de eventos y de `answers`, sin tabla nueva y
# sin estado en memoria. Es la misma postura que `state.compute`: la verdad está en el
# log, así que un servidor reiniciado a mitad de sesión retoma el bloque donde estaba en
# vez de abrir uno nuevo y contaminar el par.

TIPO_BLOQUE = "assist_block_opened"
TIPO_NUDGE = "assist_nudge_shown"


def bloques_del_log(eventos: list) -> list[Bloque]:
    fuera = []
    for e in eventos:
        if e["type"] != TIPO_BLOQUE:
            continue
        import json as _json
        d = _json.loads(e["payload"]) if isinstance(e["payload"], str) else e["payload"]
        fuera.append(Bloque(
            pair_id=d["pair_id"], subskill_id=d["subskill_id"], q1=d["q1"], q2=d["q2"],
            orden=(d["orden"][0], d["orden"][1]), seed=d["seed"],
            probe_q1=d["probe_q1"], probe_q2=d["probe_q2"],
        ))
    return fuera


def situar(bloques: list[Bloque], contestadas: set[str], qid: str
           ) -> tuple[Bloque, int] | None:
    """Where does `qid` sit — which block, which position? None if it is unpaired.

    A block whose two items are both answered is closed and can no longer claim an item;
    without that check, re-serving `q1` after a wrong answer would record a second
    position-1 row under the same `pair_id` and quietly turn one pair into three cells.
    """
    for b in bloques:
        if b.q1 == qid and not (b.q1 in contestadas and b.q2 in contestadas):
            return b, 1
        if b.q2 == qid and not (b.q1 in contestadas and b.q2 in contestadas):
            return b, 2
    return None


def a_medias(bloques: list[Bloque], contestadas: set[str]) -> Bloque | None:
    """El bloque con su primer ítem contestado y el segundo no.

    Su `q2` es la preferencia que se le pasa al selector como DESEMPATE. Un par a medias
    no aporta ninguna observación: las dos celdas de la lectura exigen las dos posiciones.
    """
    for b in bloques:
        if b.q1 in contestadas and b.q2 not in contestadas:
            return b
    return None

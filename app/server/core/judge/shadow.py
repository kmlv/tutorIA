"""Shadow mode: the judge runs, records, and cannot move mastery.

M3 exists to answer one question — does the LLM judge agree with Kristian? — and the
only honest way to answer it is to let the judge grade real answers while its verdicts
are inert. So every judgement is written to `answers` with `shadow = 1`, and mastery
reads through `Repo.evidence()`, which filters that out. The judge cannot promote a
student even if `judge_mode` is misconfigured, because the promotion path never sees
its rows.

Going live is one setting *and* a passed gate, in that order. `JUDGE_MODE=live` without
a concordance report is a configuration mistake we would rather catch here than in a
student's transcript, so `live` is refused unless `JUDGE_GATE_PASSED=1` is also set —
a second key that only makes sense to set after reading a report.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass

from ..content.schema import Pack, Question
from ..llm.provider import LLMProvider
from ..llm.roles import Router
from .grader_open import OpenVerdict, judge_open

SHADOW = "shadow"
LIVE = "live"
OFF = "off"


def judge_mode() -> str:
    mode = (os.environ.get("JUDGE_MODE") or SHADOW).strip().lower()
    if mode not in (SHADOW, LIVE, OFF):
        return SHADOW
    if mode == LIVE and os.environ.get("JUDGE_GATE_PASSED") != "1":
        return SHADOW
    return mode


@dataclass
class ShadowResult:
    verdict: OpenVerdict
    shadow: bool
    #: What the student is told. In shadow mode the judge's verdict is never one of
    #: these: telling a student they were wrong on the strength of an unvalidated judge
    #: is exactly the harm shadow mode exists to prevent.
    student_payload: dict


ACK = {
    "es": "Anotado. Seguimos.",
    "en": "Noted. Let's keep going.",
}


def run(q: Question, answer: object, pack: Pack, *, lang: str, session_id: str,
        repo, provider: LLMProvider, router: Router | None = None,
        con_andamiaje: bool = False) -> ShadowResult:
    mode = judge_mode()
    if mode == OFF:
        repo.record_answer(
            session_id=session_id, question_id=q.id, modalidad=q.modalidad,
            raw_answer=answer, grader="llm", score=0.0, shadow=True,
            con_andamiaje=con_andamiaje, judge_json=json.dumps({"skipped": "judge off"}),
        )
        return ShadowResult(OpenVerdict(False, 0.0, invalida=True), True,
                            {"registrada": True, "mensaje": ACK.get(lang, ACK["en"])})

    v = judge_open(q, answer, pack, lang=lang, provider=provider, router=router)
    shadow = mode != LIVE

    repo.record_answer(
        session_id=session_id, question_id=q.id, modalidad=q.modalidad,
        raw_answer=answer, grader="llm", score=v.score,
        misconception_id=v.misconception_id, con_andamiaje=con_andamiaje,
        judge_json=json.dumps(v.judge, ensure_ascii=False),
        model=v.model, prompt_version=v.prompt_version, latency_ms=v.latency_ms,
        cost_usd=v.cost_usd, shadow=shadow,
    )
    repo.append_event(session_id, "judge.shadow" if shadow else "judge.live", {
        "question_id": q.id, "correcta": v.correcta, "score": v.score,
        "misconception_id": v.misconception_id, "model": v.model,
        "prompt_version": v.prompt_version, "invalida": v.invalida,
        "cost_usd": round(v.cost_usd, 6),
    })

    if shadow:
        payload = {"registrada": True, "mensaje": ACK.get(lang, ACK["en"])}
    else:
        payload = {"correcta": v.correcta, "score": v.score}
        if v.misconception_id:
            m = pack.misconception(v.misconception_id)
            # As with the deterministic graders, the student sees the Socratic probe,
            # never the raw id (decision 6).
            payload["socratica"] = getattr(m.socratic_probe, lang)

    return ShadowResult(v, shadow, payload)

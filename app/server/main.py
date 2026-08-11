"""Servidor del PoC.

La API key del proveedor LLM vive AQUÍ y nunca llega al navegador (decisión 20). Se lee
del entorno o de un `.env` que está en `.gitignore`; el servidor nunca la imprime, ni la
devuelve en `/api/health`, ni la escribe en la base.
"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.server.config import load_dotenv
from app.server.core import chat, mastery
from app.server.core.mastery import assist
from app.server.core.content.loader import FilesystemPackSource
from app.server.core.judge import shadow
from app.server.core.judge.deterministic import grade
from app.server.core.llm import default_provider
from app.server.core.llm.roles import Router
from app.server.db.repo import Repo

load_dotenv()

app = FastAPI(title="tutorIA", version="0.1.0")

packs = FilesystemPackSource()
repo = Repo(os.environ.get("TUTORIA_DB") or None)
router = Router()
provider = default_provider()


@app.get("/api/health")
def health() -> dict:
    """Expone QUÉ modelo juzga y en qué modo, nunca la credencial. Saber que el juez
    está en sombra tiene que ser una consulta de un segundo, o nadie la hace."""
    spec = router.spec("judge_open")
    return {
        "ok": True,
        "packs": packs.available(),
        "judge": {
            "mode": shadow.judge_mode(),
            "provider": provider.name,
            "model": spec.model,
            "effort": spec.effort,
        },
    }


@app.get("/api/packs/{concept_id}")
def get_pack(concept_id: str, lang: str = "es") -> dict:
    try:
        pack = packs.get_pack(concept_id, lang)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    return pack.model_dump(mode="json")


class NewSession(BaseModel):
    concept_id: str
    lang: str = "es"
    media_variant: str = "A"


@app.post("/api/session")
def create_session(body: NewSession) -> dict:
    try:
        pack = packs.get_pack(body.concept_id, body.lang)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    if body.lang not in pack.lang:
        raise HTTPException(status_code=400, detail=f"el pack no tiene idioma {body.lang}")

    sid = repo.create_session(
        concept_id=pack.id, pack_version=pack.version,
        lang=body.lang, media_variant=body.media_variant,
    )
    tl = pack.timeline(body.lang, body.media_variant)
    return {
        "session_id": sid,
        "concept_id": pack.id,
        "titulo": getattr(pack.titulo, body.lang),
        "media": tl.model_dump(mode="json") if tl else None,
        "checkpoints": [c.model_dump() for c in pack.checkpoints],
        # El guion del gráfico viaja al cliente: dice qué DIBUJAR, nunca ninguna
        # respuesta. Es la misma frontera que el resto de la sesión.
        "graph_script": pack.graph_script,
    }


class AnswerIn(BaseModel):
    question_id: str
    valor: object
    con_andamiaje: bool = False
    #: Milisegundos entre que se pintó el ítem y que se envió. Es una COVARIABLE guardada,
    #: nunca una entrada de ninguna regla: ningún veredicto ni marca se condiciona a ella.
    #: Un suelo de latencia anula verdaderos positivos —ejecutar una receta de memoria es
    #: rápido y confundirse de verdad es lento— y conserva los confusores.
    think_ms: int | None = None


@app.post("/api/session/{session_id}/answer")
def post_answer(session_id: str, body: AnswerIn) -> dict:
    """Corrige y registra. El veredicto se decide AQUÍ: si el navegador conociera la
    respuesta, el estudiante podría leerla en el bundle."""
    row = repo.get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    pack = packs.get_pack(row["concept_id"], row["lang"])

    q = next((x for x in pack.questions if x.id == body.question_id), None)
    if q is None:
        raise HTTPException(status_code=404, detail=f"pregunta {body.question_id} no existe")

    if q.grader == "llm":
        r = shadow.run(q, body.valor, pack, lang=row["lang"], session_id=session_id,
                       repo=repo, provider=provider, router=router,
                       con_andamiaje=body.con_andamiaje)
        return r.student_payload

    v = grade(q, body.valor, pack.ejemplo)
    # El brazo se lee del log, no de lo que diga el cliente. Si el navegador pudiera
    # declarar su propio brazo, la asignación dejaría de estar aleatorizada en el momento
    # en que alguien abriera las herramientas de desarrollo.
    sitio = assist.situar(
        assist.bloques_del_log(repo.events(session_id)),
        {r["question_id"] for r in repo.answers(session_id)},
        q.id,
    )
    brazo, pair_id, pos, probe = assist.NA, None, None, None
    if sitio:
        bloque, pos = sitio
        brazo = bloque.arm(pos)
        pair_id = bloque.pair_id
        probe = (bloque.probe_q1 if pos == 1 else bloque.probe_q2) if brazo == assist.PUSH else None

    repo.record_answer(
        session_id=session_id, question_id=q.id, modalidad=q.modalidad,
        raw_answer=body.valor, grader="deterministic", score=v.score,
        misconception_id=v.misconception_id,
        # Una respuesta con pista ES asistida. Registrarla como no asistida sería una
        # mentira en el esquema, y excluirla de la evidencia partiría por la mitad el
        # rendimiento de un presupuesto de 12 ítems. El criterio ya sabe pesar eso.
        con_andamiaje=body.con_andamiaje or brazo == assist.PUSH,
        assist_arm=brazo, pair_id=pair_id, pair_pos=pos, probe_id=probe,
        think_ms=body.think_ms,
    )
    repo.append_event(session_id, "answer.judged", {
        "question_id": q.id, "correcta": v.correcta,
        "misconception_id": v.misconception_id,
    })

    out: dict = {"correcta": v.correcta, "score": v.score}
    if v.misconception_id:
        m = pack.misconception(v.misconception_id)
        # el estudiante NO ve el id: ve la sonda socrática ya escrita en el catálogo.
        # El id crudo es para el instructor (decisión 6).
        out["socratica"] = getattr(m.socratic_probe, row["lang"])
    return out


class EventIn(BaseModel):
    type: str
    payload: dict = {}


@app.post("/api/session/{session_id}/events")
def post_event(session_id: str, body: EventIn) -> dict:
    """Telemetría append-only. Incluye el desfase interno de cada cue (que sustituye a
    la medición externa con celular) y la latencia hasta la primera acción tras un
    checkpoint, que es la señal de atención que justifica la pausa automática."""
    if repo.get_session(session_id) is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    seq = repo.append_event(session_id, body.type, body.payload)
    return {"seq": seq}


@app.get("/media/{concept_id}/{filename}")
def media(concept_id: str, filename: str) -> FileResponse:
    """Sirve el audio compilado. Se valida el nombre para que no se pueda salir del
    directorio del pack."""
    if "/" in filename or ".." in filename or "/" in concept_id or ".." in concept_id:
        raise HTTPException(status_code=400, detail="ruta inválida")
    path = (packs.root / concept_id / "media" / filename).resolve()
    base = (packs.root / concept_id / "media").resolve()
    if not str(path).startswith(str(base)) or not path.is_file():
        raise HTTPException(status_code=404, detail="no encontrado")
    return FileResponse(path)


def _mastery(session_id: str, row) -> tuple[dict, list, dict]:
    """Recomputes from the answer log every time.

    Mastery is a pure function of the evidence, so a change to the scoring rule
    re-scores history instead of only applying from now on. At PoC scale that costs
    nothing, and it removes a whole class of bug where a cached aggregate and the log
    disagree and nobody can say which is right.
    """
    pack = packs.get_pack(row["concept_id"], row["lang"])
    evidence = mastery.to_evidence(repo.evidence(session_id), pack)
    states = mastery.compute(pack, repo.evidence(session_id))
    repo.save_mastery(row["student_id"], row["concept_id"], states)
    return states, evidence, {"pack": pack}


class ChatIn(BaseModel):
    pregunta: str
    #: What the student is working on right now. The tutor is given the stem so it can
    #: help with *this*, and never the answer — see `core.chat.tutor`.
    question_id: str | None = None
    cue_id: str | None = None


@app.post("/api/session/{session_id}/chat")
def post_chat(session_id: str, body: ChatIn) -> dict:
    """The student can ask at any moment. The tutor cannot answer for them."""
    row = repo.get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    pack = packs.get_pack(row["concept_id"], row["lang"])
    lang = row["lang"]

    pending = next((q for q in pack.questions if q.id == body.question_id), None)
    states = mastery.compute(pack, repo.evidence(session_id))
    history = [{"role": r["role"], "content": r["content"]} for r in repo.chat(session_id)]

    r = chat.ask(body.pregunta, pack, lang=lang, provider=provider, history=history,
                 pending=pending, cue_id=body.cue_id, states=states, router=router,
                 turns_used=repo.chat_turns(session_id))

    if not r.limited:
        repo.record_chat(session_id=session_id, role="user", content=body.pregunta,
                         phase=row["phase"], question_id=body.question_id)
        repo.record_chat(session_id=session_id, role="assistant", content=r.text,
                         phase=row["phase"], model=r.model,
                         tokens_in=r.tokens_in, tokens_out=r.tokens_out,
                         question_id=body.question_id)
    if r.blocked:
        # Recorded, not swallowed: how often the tutor tries to solve is a number we
        # want. It is the only direct measure we have of the failure mode that made the
        # guardrail necessary.
        repo.append_event(session_id, "chat.answer_blocked",
                          {"question_id": body.question_id, "model": r.model})

    return {
        "respuesta": r.text,
        "limite_alcanzado": r.limited,
        "restantes": max(0, chat.MAX_TURNS - repo.chat_turns(session_id)),
    }


@app.get("/api/session/{session_id}/mastery")
def read_mastery(session_id: str) -> dict:
    """The instructor's view (decision 6). Raw misconception ids appear HERE and never
    in what the student is shown."""
    row = repo.get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    states, evidence, ctx = _mastery(session_id, row)
    pack = ctx["pack"]
    choice = mastery.next_question(pack, states, evidence)

    return {
        "concept": mastery.concept_status(states),
        "sub_skills": [
            {
                "id": s.id, "status": s.status, "p_mastery": round(s.p_mastery, 3),
                "attempts": s.attempts, "correct": s.correct, "streak": s.streak,
                "streak_modalities": sorted(s.streak_modalities),
                "streak_unscaffolded": s.streak_unscaffolded,
                "streak_llm": s.streak_llm,
                "active_misconceptions": sorted(s.active_misconceptions),
                "blockers": s.blockers,
            }
            for s in states.values()
        ],
        "next": {
            "question_id": choice.question.id if choice.question else None,
            "subskill_id": choice.subskill_id,
            "reason": choice.reason,
            "done": choice.done,
        },
        "remediations": [dict(r) for r in repo.remediations(session_id)],
        "flags": [dict(f) for f in repo.flags(row["student_id"])],
    }


@app.get("/api/session/{session_id}/next")
def read_next(session_id: str) -> dict:
    """What to ask next, as the student would receive it. Deliberately narrower than
    `/mastery`: it carries the item and, when a confusion is in the way, the Socratic
    probe — never a misconception id, never the blockers."""
    row = repo.get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    states, evidence, ctx = _mastery(session_id, row)
    pack, lang = ctx["pack"], row["lang"]

    # Si hay un par a medias, su segundo ítem entra como DESEMPATE del selector: solo
    # gana entre candidatos que la pedagogía ya declaró equivalentes. Ver `next_question`.
    eventos = repo.events(session_id)
    contestadas = {r["question_id"] for r in repo.answers(session_id)}
    bloques = assist.bloques_del_log(eventos)
    medio = assist.a_medias(bloques, contestadas)
    # `vistas` se cuenta sobre TODAS las respuestas, incluidas las del juez en sombra que
    # `evidence()` filtra. Ver `next_question`: sin esto un ítem abierto se repite sin fin.
    servidas: dict[str, int] = {}
    for r in repo.answers(session_id):
        servidas[r["question_id"]] = servidas.get(r["question_id"], 0) + 1
    choice = mastery.next_question(pack, states, evidence,
                                   preferir=medio.q2 if medio else None,
                                   vistas=servidas)

    out: dict = {"done": choice.done}
    if choice.question is None:
        return out

    q = choice.question
    out["question"] = {
        "id": q.id,
        "modalidad": q.modalidad,
        "enunciado": getattr(q.enunciado, lang),
        "opciones": [getattr(o, lang) for o in q.opciones] if q.opciones else None,
        # WHICH gesture, never WHERE it should end up. "Place a point" vs "move the
        # line" is already what the stem says out loud; the target line and the
        # tolerance stay on this side. Without it the client cannot mount the right
        # interaction and a manipulation item is a dead end with no way to answer.
        "manip_modo": (
            "point" if (q.verificacion or {}).get("tipo") == "region" else "line"
        ) if q.modalidad == "manip" else None,
    }

    # --- D-1 / RNP: la capa de emparejamiento -----------------------------------
    # Va POR ENCIMA del selector y no dentro: el selector conserva intacta su lógica
    # pedagógica y esta capa solo decide si el ítem que devolvió abre o cierra un bloque.
    # Al revés —dejando que el experimento eligiera ítem— el diseño estaría escogiendo qué
    # se enseña, que es exactamente lo que no puede hacer.
    st = states.get(choice.subskill_id)
    rem = mastery.remediation_for(pack, st, evidence) if st else None

    sitio = assist.situar(bloques, contestadas, q.id)

    # La remediación manda sobre el experimento. Si hay una confusión en medio, el alumno
    # necesita la sonda socrática, no una pista aleatorizada: el bloque se rompe y su
    # huérfano queda fuera del estadístico por el filtro de universo de la lectura.
    if sitio is None and rem is None:
        nuevo = assist.abrir_bloque(pack, session_id, q, contestadas, len(bloques))
        if nuevo is not None:
            repo.append_event(session_id, assist.TIPO_BLOQUE, nuevo.payload())
            bloques.append(nuevo)
            sitio = assist.situar(bloques, contestadas, q.id)

    brazo = assist.NA
    if sitio:
        bloque, pos = sitio
        brazo = bloque.arm(pos)
        if brazo == assist.PUSH:
            probe = bloque.probe_q1 if pos == 1 else bloque.probe_q2
            out["assist"] = {"arm": brazo,
                             "texto": assist.texto_del_nudge(pack, probe, lang)}
            repo.append_event(session_id, assist.TIPO_NUDGE,
                              {"pair_id": bloque.pair_id, "question_id": q.id,
                               "probe_id": probe})
    if "assist" not in out:
        out["assist"] = {"arm": brazo}
    # Practice was the one phase with no shown->answered trace at all.
    repo.append_event(session_id, "practice.item_shown",
                      {"question_id": q.id, "pair_id": sitio[0].pair_id if sitio else None,
                       "assist_arm": brazo})

    if rem:
        repo.record_remediation(session_id=session_id, subskill_id=rem.subskill_id,
                                action_type=rem.action, trigger_rule=rem.rule)
        if rem.rule == mastery.R4_REVISION_HUMANA:
            repo.flag(student_id=row["student_id"], session_id=session_id,
                      subskill_id=rem.subskill_id, reason="R4",
                      misconception_id=rem.misconception_id)
        if rem.rule == mastery.R1_SOCRATICA:
            out["socratica"] = rem.payload["probe"][lang]
    return out


@app.get("/api/session/{session_id}")
def read_session(session_id: str) -> dict:
    row = repo.get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="sesión desconocida")
    return {
        "session_id": row["id"],
        "concept_id": row["concept_id"],
        "lang": row["lang"],
        "phase": row["phase"],
        "media_variant": row["media_variant"],
        "events": len(repo.events(session_id)),
    }

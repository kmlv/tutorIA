"""Servidor del PoC.

La API key del proveedor LLM vive AQUÍ y nunca llega al navegador (decisión 20).
En M0 todavía no hay proveedor: esto es el esqueleto y los endpoints de contenido.
"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.server.core.content.loader import FilesystemPackSource
from app.server.core.judge.deterministic import grade
from app.server.db.repo import Repo

app = FastAPI(title="tutorIA", version="0.1.0")

packs = FilesystemPackSource()
repo = Repo(os.environ.get("TUTORIA_DB") or None)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "packs": packs.available()}


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
    tl = pack.timelines.get(body.lang)
    return {
        "session_id": sid,
        "concept_id": pack.id,
        "titulo": getattr(pack.titulo, body.lang),
        "media": tl.model_dump(mode="json") if tl else None,
        "checkpoints": [c.model_dump() for c in pack.checkpoints],
    }


class AnswerIn(BaseModel):
    question_id: str
    valor: object
    con_andamiaje: bool = False


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
    if q.grader != "deterministic":
        raise HTTPException(status_code=501, detail="el juez LLM llega en M3")

    v = grade(q, body.valor, pack.ejemplo)
    repo.record_answer(
        session_id=session_id, question_id=q.id, modalidad=q.modalidad,
        raw_answer=body.valor, grader="deterministic", score=v.score,
        misconception_id=v.misconception_id, con_andamiaje=body.con_andamiaje,
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

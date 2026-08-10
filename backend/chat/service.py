import re
import json as json_lib
from sqlalchemy.orm import Session
from fastapi import HTTPException
from openai import OpenAI
from typing import Generator

from core.config import settings
from core.models import (
    Topic, ChatSession, Message, Enrollment, User,
    SubSkill, Misconception, SubSkillMastery, Event,
)
from core.pedagogy import match_pack

client = OpenAI(api_key=settings.OPENAI_API_KEY)

BASE_SYSTEM_PROMPT = """Eres tutorIA, un tutor experto en microeconomía. Tu objetivo es enseñar al alumno \
el tema asignado de forma clara, adaptada a su nivel y progresiva.

Reglas generales:
- Explica con ejemplos concretos y cotidianos
- Usa lenguaje claro, evita jerga innecesaria
- Cuando un concepto se beneficie de un gráfico, inclúyelo en formato especial

Formato de gráfico (solo cuando sea útil):
[GRAPH]{"type":"scatter","data":[{"x":[0,10],"y":[20,0],"mode":"lines","name":"Restricción"}],\
"layout":{"title":"Restricción Presupuestaria","xaxis":{"title":"Bien 1"},"yaxis":{"title":"Bien 2"}}}[/GRAPH]

Sé conversacional. El alumno aprende interactuando, no leyendo un libro."""


def _build_system_prompt(topic: Topic, subskills: list, mastery_map: dict, misconceptions: list) -> str:
    prompt = BASE_SYSTEM_PROMPT
    prompt += f"\n\nTema: {topic.title}"
    if topic.description:
        prompt += f"\nDescripción: {topic.description}"

    if not subskills:
        return prompt

    prompt += "\n\n## SISTEMA PEDAGÓGICO ACTIVO\n"
    prompt += "Este tema tiene sub-skills verificables. Enseña Y verifica el dominio de cada una.\n"

    prompt += "\n### Sub-skills (trabaja una a la vez, en orden preferente):\n"
    for ss in subskills:
        p = mastery_map.get(ss.code)
        if p is None:
            status = "sin evidencia"
        elif p >= 0.80:
            status = "✓ dominada"
        else:
            status = f"en progreso (p={p:.2f})"
        prompt += f"- {ss.code}: {ss.title} [{status}]\n"

    prompt += """
### Política de remediación (aplica en orden, primera regla que aplica gana):
R0: Alumno respondió correctamente (score ≥ 0.8) → confirma brevemente, avanza a la siguiente sub-skill
R1: Error identificable → haz UNA pregunta socrática, NO expliques directamente todavía
R2: Mismo error persiste tras R1 → cambia representación (fórmula→números concretos, números→gráfica)
R3: Sigue sin entender → simplifica radicalmente (usa p₁=2, p₂=1, m=10)
"""

    if misconceptions:
        prompt += "\n### Misconceptions conocidas — cuando detectes alguna, usa su sonda socrática antes de explicar:\n"
        for m in misconceptions:
            prompt += f"\n**{m.code} — {m.name}**\n"
            prompt += f"  Señal: {m.signal}\n"
            prompt += f"  Sonda socrática: {m.socratic_probe}\n"
            prompt += f"  Si persiste: {m.alt_representation}\n"

    prompt += """
### OBLIGATORIO — bloque de actualización al final de CADA respuesta tuya:

[MASTERY_UPDATE]{"subskill": "BL.EQ", "score": 0.5, "misconception": null}[/MASTERY_UPDATE]

Reglas del bloque:
- subskill: código de la sub-skill más relevante en este intercambio, o null si fue conversación general
- score: 0.0 error grave | 0.3 parcial con misconception | 0.5 parcial sin error claro | 0.8 correcto con ayuda | 1.0 correcto sin ayuda
- misconception: código detectado (ej: "BL-M1") o null

Este bloque no se muestra al alumno. Emítelo siempre, sin excepción."""

    return prompt


def _ensure_pedagogy_seeded(db: Session, topic: Topic):
    existing = db.query(SubSkill).filter(SubSkill.topic_id == topic.id).first()
    if existing:
        return
    pack = match_pack(topic.title)
    if not pack:
        return
    for ss in pack["subskills"]:
        db.add(SubSkill(topic_id=topic.id, code=ss["code"], title=ss["title"], order=ss["order"]))
    for m in pack["misconceptions"]:
        db.add(Misconception(
            topic_id=topic.id,
            code=m["code"],
            name=m["name"],
            signal=m["signal"],
            socratic_probe=m["socratic_probe"],
            alt_representation=m["alt_representation"],
        ))
    db.commit()


def _get_mastery_map(db: Session, student_id: int, subskills: list) -> dict:
    result = {}
    for ss in subskills:
        mastery = db.query(SubSkillMastery).filter(
            SubSkillMastery.student_id == student_id,
            SubSkillMastery.subskill_id == ss.id,
        ).first()
        if mastery:
            result[ss.code] = mastery.p_mastery
    return result


def _process_mastery_update(db: Session, full_response: str, session: ChatSession, student: User):
    pattern = r'\[MASTERY_UPDATE\](.*?)\[/MASTERY_UPDATE\]'
    matches = re.findall(pattern, full_response, re.DOTALL)

    for raw in matches:
        try:
            data = json_lib.loads(raw.strip())
            code = data.get("subskill")
            score = float(data.get("score", 0.5))
            misconception_code = data.get("misconception")

            if not code:
                continue

            subskill = db.query(SubSkill).filter(
                SubSkill.topic_id == session.topic_id,
                SubSkill.code == code,
            ).first()
            if not subskill:
                continue

            mastery = db.query(SubSkillMastery).filter(
                SubSkillMastery.student_id == student.id,
                SubSkillMastery.subskill_id == subskill.id,
            ).first()

            if not mastery:
                mastery = SubSkillMastery(
                    student_id=student.id,
                    subskill_id=subskill.id,
                    p_mastery=0.5,
                    evidence_count=0,
                    streak_correct=0,
                    status="not_started",
                )
                db.add(mastery)
                db.flush()

            alpha = 0.25  # LLM judge — less weight than deterministic grader
            old_p = mastery.p_mastery
            mastery.p_mastery = round(old_p + alpha * (score - old_p), 4)
            mastery.evidence_count += 1
            mastery.streak_correct = mastery.streak_correct + 1 if score >= 0.8 else 0
            mastery.status = (
                "mastered" if mastery.p_mastery >= 0.80 and mastery.streak_correct >= 3
                else "developing"
            )

            db.add(Event(
                session_id=session.id,
                type="mastery_updated",
                payload={
                    "subskill": code,
                    "score": score,
                    "p_before": old_p,
                    "p_after": mastery.p_mastery,
                    "misconception": misconception_code,
                    "evidence_count": mastery.evidence_count,
                },
            ))

            if misconception_code:
                db.add(Event(
                    session_id=session.id,
                    type="misconception_detected",
                    payload={"code": misconception_code, "subskill": code, "score": score},
                ))

            db.commit()
        except Exception:
            continue


def get_or_create_session(db: Session, topic_id: int, student: User) -> ChatSession:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.course_id == topic.course_id,
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="No estás inscrito en este curso")

    session = db.query(ChatSession).filter(
        ChatSession.topic_id == topic_id,
        ChatSession.student_id == student.id,
    ).first()

    if not session:
        session = ChatSession(topic_id=topic_id, student_id=student.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


def get_history(db: Session, session_id: int) -> list[Message]:
    return db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()


def get_topic_mastery(db: Session, topic_id: int, student_id: int) -> list[dict]:
    subskills = db.query(SubSkill).filter(SubSkill.topic_id == topic_id).order_by(SubSkill.order).all()
    result = []
    for ss in subskills:
        mastery = db.query(SubSkillMastery).filter(
            SubSkillMastery.student_id == student_id,
            SubSkillMastery.subskill_id == ss.id,
        ).first()
        result.append({
            "code": ss.code,
            "title": ss.title,
            "p_mastery": mastery.p_mastery if mastery else 0.5,
            "status": mastery.status if mastery else "not_started",
            "evidence_count": mastery.evidence_count if mastery else 0,
            "streak_correct": mastery.streak_correct if mastery else 0,
        })
    return result


def stream_response(db: Session, session: ChatSession, topic: Topic, content: str, student: User) -> Generator[str, None, None]:
    _ensure_pedagogy_seeded(db, topic)

    subskills = db.query(SubSkill).filter(SubSkill.topic_id == topic.id).order_by(SubSkill.order).all()
    misconceptions = db.query(Misconception).filter(Misconception.topic_id == topic.id).all()
    mastery_map = _get_mastery_map(db, student.id, subskills)

    history = get_history(db, session.id)

    system_prompt = _build_system_prompt(topic, subskills, mastery_map, misconceptions)

    messages = [{"role": "system", "content": system_prompt}]
    if not history:
        intro = f"Hola! Vamos a estudiar **{topic.title}**."
        if subskills:
            intro += f" Trabajaremos {len(subskills)} habilidades clave juntos."
        intro += " ¿Por dónde quieres empezar?"
        messages.append({"role": "assistant", "content": intro})

    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": content})

    db.add(Message(session_id=session.id, role="user", content=content))
    db.add(Event(session_id=session.id, type="answer_submitted", payload={"content": content}))
    db.commit()

    full_response = ""
    try:
        stream = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            stream=True,
            max_completion_tokens=1500,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_response += delta
            yield delta
    except Exception as e:
        error_msg = f"[Error al conectar con la IA: {str(e)}]"
        full_response = error_msg
        yield error_msg

    db.add(Message(session_id=session.id, role="assistant", content=full_response))
    db.commit()

    _process_mastery_update(db, full_response, session, student)

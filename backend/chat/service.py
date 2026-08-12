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
    Slide, SlideCompletion,
)
from core.pedagogy import match_pack

client = OpenAI(api_key=settings.OPENAI_API_KEY)

BASE_SYSTEM_PROMPT = """Eres tutorIA, un tutor experto en microeconomía. Tu objetivo es enseñar al alumno \
el tema asignado de forma clara, adaptada a su nivel y progresiva.

Reglas generales:
- Explica con ejemplos concretos y cotidianos
- Usa lenguaje claro, evita jerga innecesaria
- Cuando un concepto se beneficie de un gráfico, inclúyelo en formato especial
- Para fórmulas matemáticas usa sintaxis LaTeX: $...$ para expresiones inline (ej: $p_1 x_1 + p_2 x_2 = m$) \
y $$...$$ en su propia línea para ecuaciones destacadas (ej: $$\\frac{m}{p_1}$$)

Formato de gráficos de restricción presupuestaria (usa solo cuando aporten claridad):
[GRAPH]{"type":"budget_line","m":100,"p1":10,"p2":5}[/GRAPH]
[GRAPH]{"type":"budget_line_shift","m1":80,"m2":120,"p1":10,"p2":5}[/GRAPH]
[GRAPH]{"type":"budget_line_pivot","m":100,"p1_old":10,"p1_new":5,"p2":5}[/GRAPH]

Tipos disponibles:
- budget_line: restricción simple. m=ingreso, p1=precio bien 1, p2=precio bien 2.
- budget_line_shift: desplazamiento paralelo por cambio de ingreso. m1=ingreso original, m2=ingreso nuevo.
- budget_line_pivot: pivote por cambio en p1. p1_old=precio original, p1_new=precio nuevo.

Ejemplos de uso en evaluación: muestra una gráfica con datos concretos y pide al alumno identificar interceptos, \
pendiente, o qué cambia ante una variación de precio o ingreso. No obligatorio en cada respuesta.

Sé conversacional. El alumno aprende interactuando, no leyendo un libro."""


def _build_system_prompt(topic: Topic, subskills: list, mastery_map: dict, misconceptions: list, assessment_mode: bool = False, slides_summary: str = "") -> str:
    prompt = BASE_SYSTEM_PROMPT
    prompt += f"\n\nTema: {topic.title}"
    if topic.description:
        prompt += f"\nDescripción: {topic.description}"

    if assessment_mode and slides_summary:
        prompt += f"\n\n## CONTEXTO\nEl alumno ya estudió el contenido de este tema. Lo que vio:\n{slides_summary}"
        prompt += "\n\nNo re-expliques el material desde cero. Verifica comprensión, y si hay confusión, usa la política de remediación."

    if not subskills:
        return prompt

    mode_label = "EVALUACIÓN ACTIVA" if assessment_mode else "SISTEMA PEDAGÓGICO ACTIVO"
    prompt += f"\n\n## {mode_label}\n"
    if assessment_mode:
        prompt += "El alumno ya vio el contenido. Tu rol ahora es verificar el dominio de cada sub-skill mediante preguntas directas.\n"
    else:
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


def _get_slides_summary(db: Session, topic_id: int) -> str:
    slides = db.query(Slide).filter(Slide.topic_id == topic_id).order_by(Slide.order).all()
    parts = []
    for s in slides:
        if s.type == "text":
            # Take first 300 chars as summary
            parts.append(s.content[:300].replace("\n", " "))
        elif s.type == "graph":
            parts.append("[Gráfica incluida en el material]")
    return " | ".join(parts)


def get_topic_mastery(db: Session, topic_id: int, student_id: int) -> list[dict]:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        _ensure_pedagogy_seeded(db, topic)
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


def stream_begin_evaluation(db: Session, session: ChatSession, topic: Topic, student: User) -> Generator[str, None, None]:
    """Stream the AI's first evaluation question without recording a user message."""
    _ensure_pedagogy_seeded(db, topic)

    subskills = db.query(SubSkill).filter(SubSkill.topic_id == topic.id).order_by(SubSkill.order).all()
    misconceptions = db.query(Misconception).filter(Misconception.topic_id == topic.id).all()
    mastery_map = _get_mastery_map(db, student.id, subskills)
    slides_summary = _get_slides_summary(db, topic.id)

    system_prompt = _build_system_prompt(
        topic, subskills, mastery_map, misconceptions,
        assessment_mode=True, slides_summary=slides_summary,
    )
    system_prompt += (
        "\n\n---\n"
        "INSTRUCCION: El alumno acaba de terminar los slides del tema. "
        "Comienza con UNA sola oración corta que avise que vas a hacer un repaso rápido de lo que vio "
        "(menciona el tema, tono amigable, sin exagerar). "
        "Inmediatamente después, en el mismo mensaje, haz la primera pregunta de evaluación "
        "de la sub-skill con menos evidencia. Máximo 3 oraciones en total."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "comenzar"},
    ]

    full_response = ""
    try:
        stream = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            stream=True,
            max_completion_tokens=300,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_response += delta
            yield delta
    except Exception as e:
        error_msg = f"[Error: {e}]"
        full_response = error_msg
        yield error_msg
        return

    db.add(Message(session_id=session.id, role="assistant", content=full_response))
    db.add(Event(session_id=session.id, type="evaluation_started", payload={"topic_id": topic.id}))
    db.commit()


def stream_response(db: Session, session: ChatSession, topic: Topic, content: str, student: User) -> Generator[str, None, None]:
    _ensure_pedagogy_seeded(db, topic)

    subskills = db.query(SubSkill).filter(SubSkill.topic_id == topic.id).order_by(SubSkill.order).all()
    misconceptions = db.query(Misconception).filter(Misconception.topic_id == topic.id).all()
    mastery_map = _get_mastery_map(db, student.id, subskills)

    has_slides = db.query(Slide).filter(Slide.topic_id == topic.id).first() is not None
    slide_done = db.query(SlideCompletion).filter(
        SlideCompletion.student_id == student.id,
        SlideCompletion.topic_id == topic.id,
    ).first() is not None
    assessment_mode = has_slides and slide_done
    slides_summary = _get_slides_summary(db, topic.id) if assessment_mode else ""

    history = get_history(db, session.id)

    system_prompt = _build_system_prompt(topic, subskills, mastery_map, misconceptions, assessment_mode, slides_summary)

    messages = [{"role": "system", "content": system_prompt}]
    if not history:
        if assessment_mode:
            intro = f"Perfecto, ya viste el contenido de **{topic.title}**. Vamos a verificar que todo quedó claro con algunas preguntas. ¿Listo?"
        else:
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

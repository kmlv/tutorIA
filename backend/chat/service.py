from sqlalchemy.orm import Session
from fastapi import HTTPException
from openai import OpenAI
from typing import Generator

from core.config import settings
from core.models import Topic, ChatSession, Message, Enrollment, User

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """Eres tutorIA, un tutor experto en microeconomía. Tu objetivo es enseñar al alumno el tema asignado de forma clara, adaptada a su nivel y progresiva.

Reglas:
- Explica con ejemplos concretos y cotidianos
- Usa lenguaje claro, evita jerga innecesaria
- Si el alumno comete un error, corrígelo con amabilidad y explica el porqué
- Genera ejercicios cuando el alumno lo pida o cuando detectes que ya entiende la teoría
- Cuando un concepto se beneficie de un gráfico, inclúyelo en formato especial al final del mensaje

Formato de gráfico (solo cuando sea útil):
[GRAPH]{"type":"scatter","data":[{"x":[0,50],"y":[100,0],"mode":"lines","name":"Restricción"}],"layout":{"title":"Restricción Presupuestaria","xaxis":{"title":"Bien X"},"yaxis":{"title":"Bien Y"}}}[/GRAPH]

Recuerda: el alumno aprende interactuando contigo, no leyendo un libro. Sé conversacional."""


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


def build_messages(topic: Topic, history: list[Message], new_content: str) -> list[dict]:
    topic_context = f"Tema: {topic.title}"
    if topic.description:
        topic_context += f"\nDescripción: {topic.description}"
    if topic.objectives:
        topic_context += f"\nObjetivos de aprendizaje: {topic.objectives}"

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{topic_context}"},
    ]

    if not history:
        messages.append({
            "role": "assistant",
            "content": f"Hola! Vamos a estudiar **{topic.title}**. {('Los objetivos son: ' + topic.objectives) if topic.objectives else ''}\n\n¿Por dónde quieres empezar?"
        })

    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": new_content})
    return messages


def stream_response(db: Session, session: ChatSession, topic: Topic, content: str) -> Generator[str, None, None]:
    history = get_history(db, session.id)
    messages = build_messages(topic, history, content)

    user_msg = Message(session_id=session.id, role="user", content=content)
    db.add(user_msg)
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

    assistant_msg = Message(session_id=session.id, role="assistant", content=full_response)
    db.add(assistant_msg)
    db.commit()

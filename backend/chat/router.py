from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User, Topic, Message, SlideCompletion, ChatSession
from auth.dependencies import require_student
from chat.schemas import MessageRequest, MessageResponse
from chat.service import get_or_create_session, get_history, get_topic_mastery, stream_response, stream_begin_evaluation

router = APIRouter()


@router.get("/topic/{topic_id}/history", response_model=list[MessageResponse])
def history(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = get_or_create_session(db, topic_id, student)
    return get_history(db, session.id)


@router.get("/topic/{topic_id}/mastery")
def mastery(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    return get_topic_mastery(db, topic_id, student.id)


@router.post("/topic/{topic_id}/begin")
def begin(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = get_or_create_session(db, topic_id, student)
    if get_history(db, session.id):
        return Response(status_code=204)
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    return StreamingResponse(
        stream_begin_evaluation(db, session, topic, student),
        media_type="text/event-stream",
    )


@router.post("/topic/{topic_id}/message")
def message(topic_id: int, body: MessageRequest, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = get_or_create_session(db, topic_id, student)
    topic = db.query(Topic).filter(Topic.id == topic_id).first()

    return StreamingResponse(
        stream_response(db, session, topic, body.content, student),
        media_type="text/event-stream",
    )


@router.post("/topic/{topic_id}/reset", status_code=204)
def reset_session(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = db.query(ChatSession).filter(
        ChatSession.topic_id == topic_id,
        ChatSession.student_id == student.id,
    ).first()
    if session:
        db.query(Message).filter(Message.session_id == session.id).delete()
        db.commit()
    db.query(SlideCompletion).filter(
        SlideCompletion.student_id == student.id,
        SlideCompletion.topic_id == topic_id,
    ).delete()
    db.commit()

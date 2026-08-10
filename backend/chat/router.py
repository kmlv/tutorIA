from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User, Topic
from auth.dependencies import require_student
from chat.schemas import MessageRequest, MessageResponse
from chat.service import get_or_create_session, get_history, stream_response

router = APIRouter()


@router.get("/topic/{topic_id}/history", response_model=list[MessageResponse])
def history(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = get_or_create_session(db, topic_id, student)
    return get_history(db, session.id)


@router.post("/topic/{topic_id}/message")
def message(topic_id: int, body: MessageRequest, db: Session = Depends(get_db), student: User = Depends(require_student)):
    session = get_or_create_session(db, topic_id, student)
    topic = db.query(Topic).filter(Topic.id == topic_id).first()

    return StreamingResponse(
        stream_response(db, session, topic, body.content),
        media_type="text/event-stream",
    )

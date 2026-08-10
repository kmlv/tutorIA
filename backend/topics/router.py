from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User
from auth.dependencies import require_professor
from topics.schemas import TopicCreate, TopicResponse
from topics.service import add_topic, get_course_topics, delete_topic

router = APIRouter()


@router.post("/course/{course_id}", response_model=TopicResponse)
def create(course_id: int, body: TopicCreate, db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    return add_topic(db, course_id, body.title, body.description, body.objectives, body.order, professor)


@router.get("/course/{course_id}", response_model=list[TopicResponse])
def list_topics(course_id: int, db: Session = Depends(get_db), _: User = Depends(require_professor)):
    return get_course_topics(db, course_id)


@router.delete("/{topic_id}", status_code=204)
def remove(topic_id: int, db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    delete_topic(db, topic_id, professor)

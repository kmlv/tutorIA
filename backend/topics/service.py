from sqlalchemy.orm import Session
from fastapi import HTTPException

from core.models import Topic, Course, User


def add_topic(db: Session, course_id: int, title: str, description: str | None, objectives: str | None, order: int, professor: User) -> Topic:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    if course.professor_id != professor.id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre este curso")

    topic = Topic(
        title=title,
        description=description,
        objectives=objectives,
        order=order,
        course_id=course_id,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


def get_course_topics(db: Session, course_id: int) -> list[Topic]:
    return db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order).all()


def delete_topic(db: Session, topic_id: int, professor: User) -> None:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    if topic.course.professor_id != professor.id:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre este tema")
    db.delete(topic)
    db.commit()

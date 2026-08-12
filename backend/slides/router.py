from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import Slide, SlideCompletion, Topic, Course, User, Enrollment
from auth.dependencies import require_professor, require_student
from slides.schemas import SlideCreate, SlideResponse

router = APIRouter()


def _get_topic_for_professor(topic_id: int, professor: User, db: Session) -> Topic:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    course = db.query(Course).filter(Course.id == topic.course_id, Course.professor_id == professor.id).first()
    if not course:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre este tema")
    return topic


@router.get("/topic/{topic_id}", response_model=list[SlideResponse])
def list_slides(topic_id: int, db: Session = Depends(get_db)):
    return db.query(Slide).filter(Slide.topic_id == topic_id).order_by(Slide.order).all()


@router.post("/topic/{topic_id}", response_model=SlideResponse)
def create_slide(topic_id: int, body: SlideCreate, db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    _get_topic_for_professor(topic_id, professor, db)
    slide = Slide(topic_id=topic_id, type=body.type, content=body.content, order=body.order)
    db.add(slide)
    db.commit()
    db.refresh(slide)
    return slide


@router.delete("/{slide_id}", status_code=204)
def delete_slide(slide_id: int, db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide no encontrado")
    _get_topic_for_professor(slide.topic_id, professor, db)
    db.delete(slide)
    db.commit()


@router.post("/topic/{topic_id}/complete", status_code=204)
def complete_slides(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    enrolled = db.query(Enrollment).join(Topic, Topic.course_id == Enrollment.course_id).filter(
        Topic.id == topic_id,
        Enrollment.student_id == student.id,
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="No estás inscrito en este curso")

    existing = db.query(SlideCompletion).filter(
        SlideCompletion.student_id == student.id,
        SlideCompletion.topic_id == topic_id,
    ).first()
    if not existing:
        db.add(SlideCompletion(student_id=student.id, topic_id=topic_id))
        db.commit()


@router.get("/topic/{topic_id}/completed")
def check_completed(topic_id: int, db: Session = Depends(get_db), student: User = Depends(require_student)):
    completed = db.query(SlideCompletion).filter(
        SlideCompletion.student_id == student.id,
        SlideCompletion.topic_id == topic_id,
    ).first()
    return {"completed": completed is not None}

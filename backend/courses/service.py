import random
import string
from sqlalchemy.orm import Session
from fastapi import HTTPException

from core.models import Course, Enrollment, User


def generate_invite_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def create_course(db: Session, title: str, description: str | None, professor: User) -> Course:
    code = generate_invite_code()
    while db.query(Course).filter(Course.invite_code == code).first():
        code = generate_invite_code()

    course = Course(
        title=title,
        description=description,
        invite_code=code,
        professor_id=professor.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def get_professor_courses(db: Session, professor_id: int) -> list[Course]:
    return db.query(Course).filter(Course.professor_id == professor_id).all()


def get_course(db: Session, course_id: int) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return course


def join_course(db: Session, invite_code: str, student: User) -> Enrollment:
    course = db.query(Course).filter(Course.invite_code == invite_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Código de invitación inválido")

    existing = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.course_id == course.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya estás inscrito en este curso")

    enrollment = Enrollment(student_id=student.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def get_student_enrollments(db: Session, student_id: int) -> list[Enrollment]:
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).all()

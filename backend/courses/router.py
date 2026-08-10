from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User
from auth.dependencies import require_professor, require_student
from courses.schemas import CourseCreate, CourseResponse, JoinCourseRequest, EnrollmentResponse
from courses.service import create_course, get_professor_courses, get_course, join_course, get_student_enrollments

router = APIRouter()


@router.post("", response_model=CourseResponse)
def create(body: CourseCreate, db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    return create_course(db, body.title, body.description, professor)


@router.get("/mine", response_model=list[CourseResponse])
def my_courses(db: Session = Depends(get_db), professor: User = Depends(require_professor)):
    return get_professor_courses(db, professor.id)


@router.get("/enrolled", response_model=list[EnrollmentResponse])
def enrolled_courses(db: Session = Depends(get_db), student: User = Depends(require_student)):
    return get_student_enrollments(db, student.id)


@router.post("/join", response_model=EnrollmentResponse)
def join(body: JoinCourseRequest, db: Session = Depends(get_db), student: User = Depends(require_student)):
    return join_course(db, body.invite_code, student)


@router.get("/{course_id}", response_model=CourseResponse)
def get_one(course_id: int, db: Session = Depends(get_db), _: User = Depends(require_professor)):
    return get_course(db, course_id)

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TopicSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    objectives: Optional[str]
    order: int

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None


class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    invite_code: str
    professor_id: int
    created_at: datetime
    topics: list[TopicSummary] = []

    class Config:
        from_attributes = True


class JoinCourseRequest(BaseModel):
    invite_code: str


class EnrollmentResponse(BaseModel):
    id: int
    course: CourseResponse
    enrolled_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional


class TopicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    objectives: Optional[str] = None
    order: int = 0


class TopicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    objectives: Optional[str]
    order: int
    course_id: int

    class Config:
        from_attributes = True

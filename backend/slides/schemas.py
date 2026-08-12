from pydantic import BaseModel


class SlideCreate(BaseModel):
    type: str  # text | graph
    content: str
    order: int = 0


class SlideResponse(BaseModel):
    id: int
    topic_id: int
    type: str
    content: str
    order: int

    class Config:
        from_attributes = True

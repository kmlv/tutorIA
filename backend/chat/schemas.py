from pydantic import BaseModel


class MessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str

    class Config:
        from_attributes = True

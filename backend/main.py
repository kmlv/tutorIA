from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Base, engine
from auth.router import router as auth_router
from courses.router import router as courses_router
from topics.router import router as topics_router
from chat.router import router as chat_router
from exercises.router import router as exercises_router
from slides.router import router as slides_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="tutorIA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(courses_router, prefix="/courses", tags=["courses"])
app.include_router(topics_router, prefix="/topics", tags=["topics"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(exercises_router, prefix="/exercises", tags=["exercises"])
app.include_router(slides_router, prefix="/slides", tags=["slides"])


@app.get("/health")
def health():
    return {"status": "ok"}

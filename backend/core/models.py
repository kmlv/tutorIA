from sqlalchemy import Boolean, Column, Float, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_professor = Column(Boolean, default=False)
    is_student = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses_created = relationship("Course", back_populates="professor")
    enrollments = relationship("Enrollment", back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    invite_code = Column(String, unique=True, index=True)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    professor = relationship("User", back_populates="courses_created")
    topics = relationship("Topic", back_populates="course", order_by="Topic.order")
    enrollments = relationship("Enrollment", back_populates="course")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    objectives = Column(Text)
    order = Column(Integer, default=0)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    course = relationship("Course", back_populates="topics")
    sessions = relationship("ChatSession", back_populates="topic")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic", back_populates="sessions")
    messages = relationship("Message", back_populates="session", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    student_answer = Column(Text)
    feedback = Column(Text)
    is_correct = Column(Boolean)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SubSkill(Base):
    __tablename__ = "subskills"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    code = Column(String, nullable=False)
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)


class Misconception(Base):
    __tablename__ = "misconceptions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    signal = Column(Text, nullable=False)
    socratic_probe = Column(Text, nullable=False)
    alt_representation = Column(Text, nullable=False)


class SubSkillMastery(Base):
    __tablename__ = "subskill_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subskill_id = Column(Integer, ForeignKey("subskills.id"), nullable=False)
    p_mastery = Column(Float, default=0.5)
    evidence_count = Column(Integer, default=0)
    streak_correct = Column(Integer, default=0)
    status = Column(String, default="not_started")  # not_started | developing | mastered
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    ts = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(String, nullable=False)
    payload = Column(JSON)


class Slide(Base):
    __tablename__ = "slides"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    type = Column(String, nullable=False)  # text | graph
    content = Column(Text, nullable=False)
    order = Column(Integer, default=0)


class SlideCompletion(Base):
    __tablename__ = "slide_completions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

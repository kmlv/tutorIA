from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth.service import register_user, authenticate_user, create_access_token
from auth.dependencies import get_current_user
from core.models import User

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, body.email, body.password, body.name, body.is_professor, body.is_student)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

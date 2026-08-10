from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from core.config import settings
from core.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def register_user(db: Session, email: str, password: str, name: str, is_professor: bool, is_student: bool) -> User:
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if not is_professor and not is_student:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos un rol")
    user = User(
        email=email,
        hashed_password=hash_password(password),
        name=name,
        is_professor=is_professor,
        is_student=is_student,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return user

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User
from auth.service import decode_token

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


def require_professor(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_professor:
        raise HTTPException(status_code=403, detail="Se requiere rol de profesor")
    return current_user


def require_student(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_student:
        raise HTTPException(status_code=403, detail="Se requiere rol de alumno")
    return current_user

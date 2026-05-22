from __future__ import annotations
from fastapi import Depends, Cookie
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_token
from app.core.permissions import has_any_role
from app.models.user import User

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise AuthError("No credentials provided.")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise AuthError("Invalid token type.")
        user_id: int = int(payload.get("sub"))
    except JWTError:
        raise AuthError("Invalid or expired token.")

    from app.repositories.user_repository import UserRepository
    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise AuthError("User not found or inactive.")
    return user


def require_role(*roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not has_any_role(current_user.role, *roles):
            raise ForbiddenError(f"Requires one of roles: {', '.join(roles)}")
        return current_user
    return dependency


def get_current_user_from_refresh(
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not refresh_token:
        raise AuthError("No refresh token provided.")
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthError("Invalid token type.")
        user_id: int = int(payload.get("sub"))
    except JWTError:
        raise AuthError("Invalid or expired refresh token.")

    from app.repositories.user_repository import UserRepository
    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise AuthError("User not found or inactive.")
    return user

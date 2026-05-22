from __future__ import annotations
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, get_current_user_from_refresh
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshResponse
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    svc = AuthService(db)
    user, access_token, refresh_token = svc.login(body.email, body.password)
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7,
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token,
                         user=UserOut.model_validate(user))


@router.post("/refresh", response_model=RefreshResponse)
def refresh(current_user: User = Depends(get_current_user_from_refresh), db: Session = Depends(get_db)):
    svc = AuthService(db)
    access_token = svc.refresh(current_user)
    return RefreshResponse(access_token=access_token)


@router.post("/logout", status_code=204)
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuthService(db).logout(current_user)
    response.delete_cookie("refresh_token")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

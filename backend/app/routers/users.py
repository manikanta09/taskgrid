from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserOut, UserListOut
from app.services.user_service import UserService

router = APIRouter()


def _svc(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get("", response_model=UserListOut)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: str | None = None,
    _: User = Depends(require_role("admin", "manager")),
    svc: UserService = Depends(_svc),
):
    return svc.list_users(page=page, limit=limit, role=role)


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    body: UserCreate,
    current_user: User = Depends(require_role("admin")),
    svc: UserService = Depends(_svc),
):
    return svc.create_user(body, actor_id=current_user.id)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    _: User = Depends(require_role("admin", "manager")),
    svc: UserService = Depends(_svc),
):
    return svc.get_user(user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    svc: UserService = Depends(_svc),
):
    return svc.update_user(user_id, body, actor_id=current_user.id)


@router.post("/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    svc: UserService = Depends(_svc),
):
    return svc.deactivate(user_id, actor_id=current_user.id)


@router.post("/{user_id}/reactivate", response_model=UserOut)
def reactivate_user(
    user_id: int,
    _: User = Depends(require_role("admin")),
    svc: UserService = Depends(_svc),
):
    return svc.reactivate(user_id)

from __future__ import annotations
import math
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import AuditService


class UserService:
    def __init__(self, user_repo: UserRepository, db: Session | None = None):
        self.user_repo = user_repo
        self.audit = AuditService(user_repo.db) if db is None else AuditService(db)

    def create_user(self, data: UserCreate, actor_id: int | None = None) -> User:
        if self.user_repo.get_by_email(data.email):
            raise ConflictError(f"User with email {data.email} already exists.")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )
        user = self.user_repo.create(user)
        self.audit.log("user.created", "user", user.id, actor_id=actor_id,
                       after_state={"email": user.email, "role": user.role})
        return user

    def update_user(self, user_id: int, data: UserUpdate, actor_id: int | None = None) -> User:
        user = self._get_or_404(user_id)
        before = {"role": user.role, "full_name": user.full_name}
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.role is not None:
            user.role = data.role
        user = self.user_repo.save(user)
        self.audit.log("user.role_changed", "user", user.id, actor_id=actor_id,
                       before_state=before, after_state={"role": user.role, "full_name": user.full_name})
        return user

    def deactivate(self, user_id: int, actor_id: int | None = None) -> User:
        user = self._get_or_404(user_id)
        user.is_active = False
        user = self.user_repo.save(user)
        self.audit.log("user.deactivated", "user", user.id, actor_id=actor_id)
        return user

    def reactivate(self, user_id: int, actor_id: int | None = None) -> User:
        user = self._get_or_404(user_id)
        user.is_active = True
        return self.user_repo.save(user)

    def list_users(self, page: int, limit: int, role: str | None = None) -> dict:
        skip = (page - 1) * limit
        items, total = self.user_repo.list(skip=skip, limit=limit, role=role)
        return {"items": items, "total": total, "page": page, "limit": limit,
                "pages": max(1, math.ceil(total / limit))}

    def get_user(self, user_id: int) -> User:
        return self._get_or_404(user_id)

    def _get_or_404(self, user_id: int) -> User:
        user = self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user

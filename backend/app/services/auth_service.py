from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.exceptions import AuthError
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.services.audit_service import AuditService


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.audit = AuditService(db)

    def login(self, email: str, password: str) -> tuple[User, str, str]:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AuthError("Invalid email or password.")
        if not user.is_active:
            raise AuthError("Account is deactivated.")

        user.last_login_at = datetime.now(timezone.utc)
        self.user_repo.save(user)

        access_token = create_access_token({"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        self.audit.log("auth.login", "user", user.id, actor_id=user.id)
        return user, access_token, refresh_token

    def refresh(self, user: User) -> str:
        return create_access_token({"sub": user.id, "role": user.role})

    def logout(self, user: User):
        self.audit.log("auth.logout", "user", user.id, actor_id=user.id)

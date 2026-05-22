from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def list(self, skip: int = 0, limit: int = 20, role: str | None = None) -> tuple[list[User], int]:
        q = self.db.query(User)
        if role:
            q = q.filter(User.role == role)
        total = q.count()
        return q.offset(skip).limit(limit).all(), total

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def save(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

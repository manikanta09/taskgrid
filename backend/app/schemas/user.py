from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Literal


UserRole = Literal["admin", "manager", "operator", "viewer"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = "operator"


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListOut(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    limit: int
    pages: int

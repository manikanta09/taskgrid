from __future__ import annotations
ROLE_HIERARCHY = ["viewer", "operator", "manager", "admin"]


def role_gte(user_role: str, required_role: str) -> bool:
    """Return True if user_role is equal to or higher than required_role."""
    try:
        return ROLE_HIERARCHY.index(user_role) >= ROLE_HIERARCHY.index(required_role)
    except ValueError:
        return False


def has_any_role(user_role: str, *roles: str) -> bool:
    return user_role in roles

from __future__ import annotations
class TaskGridException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(TaskGridException):
    def __init__(self, entity: str, entity_id: int | str):
        super().__init__(
            code=f"{entity.upper()}_NOT_FOUND",
            message=f"{entity} with id {entity_id} not found.",
            status_code=404,
        )


class ForbiddenError(TaskGridException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


class ConflictError(TaskGridException):
    def __init__(self, message: str):
        super().__init__(code="CONFLICT", message=message, status_code=409)


class InvalidTransitionError(TaskGridException):
    def __init__(self, from_status: str, to_status: str):
        super().__init__(
            code="INVALID_STATUS_TRANSITION",
            message=f"Cannot transition task from {from_status} to {to_status}.",
            status_code=422,
        )


class AuthError(TaskGridException):
    def __init__(self, message: str = "Authentication failed."):
        super().__init__(code="AUTH_ERROR", message=message, status_code=401)

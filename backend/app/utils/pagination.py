from __future__ import annotations
import math
from typing import TypeVar, Generic
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")


def paginate(query: Query, page: int, limit: int) -> dict:
    limit = min(limit, 100)
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }

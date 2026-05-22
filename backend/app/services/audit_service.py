from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        action: str,
        entity_type: str,
        entity_id: int,
        actor_id: int | None = None,
        before_state: dict | None = None,
        after_state: dict | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before_state,
            after_state=after_state,
            metadata_=metadata,
        )
        self.db.add(entry)
        self.db.commit()
        return entry

    def get_entity_logs(self, entity_type: str, entity_id: int) -> list[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.asc())
            .all()
        )

    def get_all(self, skip: int = 0, limit: int = 50, entity_type: str | None = None) -> tuple[list[AuditLog], int]:
        q = self.db.query(AuditLog)
        if entity_type:
            q = q.filter(AuditLog.entity_type == entity_type)
        q = q.order_by(AuditLog.created_at.desc())
        total = q.count()
        return q.offset(skip).limit(limit).all(), total

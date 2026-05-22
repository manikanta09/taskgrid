"""
Run: python seed_demo.py
Seeds realistic demo data: 5 users, 3 workflows, 10 tasks in various states.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
import app.models  # noqa

Base.metadata.create_all(bind=engine)

from app.core.security import hash_password
from app.models.user import User
from app.models.workflow import Workflow
from app.models.task import Task
from app.models.task_assignment import TaskAssignment
from app.models.approval import Approval
from app.models.audit_log import AuditLog

db = SessionLocal()

def seed():
    if db.query(User).count() > 1:
        print("Demo data already seeded. Skipping.")
        return

    users = [
        User(email="admin@taskgrid.io",    hashed_password=hash_password("admin123"),   full_name="System Admin",    role="admin"),
        User(email="manager@taskgrid.io",  hashed_password=hash_password("manager123"), full_name="Sarah Manager",   role="manager"),
        User(email="ops1@taskgrid.io",     hashed_password=hash_password("ops123"),     full_name="Alex Operator",   role="operator"),
        User(email="ops2@taskgrid.io",     hashed_password=hash_password("ops123"),     full_name="Jordan Operator", role="operator"),
        User(email="viewer@taskgrid.io",   hashed_password=hash_password("viewer123"),  full_name="Sam Viewer",      role="viewer"),
    ]
    for u in users:
        existing = db.query(User).filter(User.email == u.email).first()
        if not existing:
            db.add(u)
    db.commit()

    admin    = db.query(User).filter(User.email == "admin@taskgrid.io").first()
    manager  = db.query(User).filter(User.email == "manager@taskgrid.io").first()
    ops1     = db.query(User).filter(User.email == "ops1@taskgrid.io").first()
    ops2     = db.query(User).filter(User.email == "ops2@taskgrid.io").first()

    workflows = [
        Workflow(
            name="Invoice Approval",
            description="3-step invoice review and approval process",
            status="ACTIVE",
            created_by_id=admin.id,
            steps=[
                {"step": 1, "name": "Data Verification",  "assignee_role": "operator", "sla_hours": 24},
                {"step": 2, "name": "Manager Approval",   "assignee_role": "manager",  "sla_hours": 8},
                {"step": 3, "name": "Finance Sign-off",   "assignee_role": "admin",    "sla_hours": 4},
            ],
        ),
        Workflow(
            name="Employee Onboarding",
            description="New hire documentation and system access workflow",
            status="ACTIVE",
            created_by_id=manager.id,
            steps=[
                {"step": 1, "name": "Document Collection", "assignee_role": "operator", "sla_hours": 48},
                {"step": 2, "name": "HR Review",           "assignee_role": "manager",  "sla_hours": 24},
            ],
        ),
        Workflow(
            name="Vendor Qualification",
            description="Vendor screening and approval workflow",
            status="DRAFT",
            created_by_id=manager.id,
            steps=[
                {"step": 1, "name": "Initial Screening", "assignee_role": "operator", "sla_hours": 72},
                {"step": 2, "name": "Final Approval",    "assignee_role": "admin",    "sla_hours": 24},
            ],
        ),
    ]
    for wf in workflows:
        db.add(wf)
    db.commit()

    inv_wf = db.query(Workflow).filter(Workflow.name == "Invoice Approval").first()
    onb_wf = db.query(Workflow).filter(Workflow.name == "Employee Onboarding").first()

    tasks_data = [
        dict(title="Invoice #INV-2024-001", workflow_id=inv_wf.id, status="PENDING_APPROVAL",
             priority="high", current_assignee_id=manager.id, created_by_id=ops1.id,
             payload={"invoice_id": "INV-2024-001", "amount": 45000, "vendor": "Acme Corp"}),
        dict(title="Invoice #INV-2024-002", workflow_id=inv_wf.id, status="IN_PROGRESS",
             priority="medium", current_assignee_id=ops1.id, created_by_id=admin.id,
             payload={"invoice_id": "INV-2024-002", "amount": 12500, "vendor": "TechParts Ltd"}),
        dict(title="Invoice #INV-2024-003", workflow_id=inv_wf.id, status="CREATED",
             priority="low", current_assignee_id=None, created_by_id=manager.id,
             payload={"invoice_id": "INV-2024-003", "amount": 3200, "vendor": "Office Supplies Co"}),
        dict(title="Invoice #INV-2024-004", workflow_id=inv_wf.id, status="COMPLETED",
             priority="high", current_assignee_id=ops2.id, created_by_id=admin.id,
             payload={"invoice_id": "INV-2024-004", "amount": 78000, "vendor": "Capital Equipment"}),
        dict(title="Invoice #INV-2024-005", workflow_id=inv_wf.id, status="REJECTED",
             priority="medium", current_assignee_id=ops1.id, created_by_id=manager.id,
             payload={"invoice_id": "INV-2024-005", "amount": 9900, "vendor": "Unknown Vendor"}),
        dict(title="Onboarding — Jane Smith",    workflow_id=onb_wf.id, status="ASSIGNED",
             priority="high", current_assignee_id=ops2.id, created_by_id=manager.id,
             payload={"employee_name": "Jane Smith", "department": "Engineering", "start_date": "2024-02-01"}),
        dict(title="Onboarding — Bob Johnson",   workflow_id=onb_wf.id, status="IN_PROGRESS",
             priority="medium", current_assignee_id=ops1.id, created_by_id=manager.id,
             payload={"employee_name": "Bob Johnson", "department": "Sales", "start_date": "2024-02-05"}),
        dict(title="Onboarding — Mary Davis",    workflow_id=onb_wf.id, status="PENDING_APPROVAL",
             priority="medium", current_assignee_id=manager.id, created_by_id=admin.id,
             payload={"employee_name": "Mary Davis", "department": "Marketing", "start_date": "2024-02-10"}),
        dict(title="Onboarding — Chris Wilson",  workflow_id=onb_wf.id, status="ESCALATED",
             priority="critical", current_assignee_id=admin.id, created_by_id=manager.id,
             payload={"employee_name": "Chris Wilson", "department": "Finance", "start_date": "2024-01-15"}),
        dict(title="Onboarding — Lisa Anderson", workflow_id=onb_wf.id, status="CREATED",
             priority="low", current_assignee_id=None, created_by_id=manager.id,
             payload={"employee_name": "Lisa Anderson", "department": "HR", "start_date": "2024-03-01"}),
    ]

    for td in tasks_data:
        db.add(Task(**td))
    db.commit()

    print(f"Seeded: {len(users)} users, {len(workflows)} workflows, {len(tasks_data)} tasks")
    print("\nDemo credentials:")
    print("  admin@taskgrid.io    / admin123")
    print("  manager@taskgrid.io  / manager123")
    print("  ops1@taskgrid.io     / ops123")
    print("  ops2@taskgrid.io     / ops123")
    print("  viewer@taskgrid.io   / viewer123")


if __name__ == "__main__":
    try:
        seed()
    finally:
        db.close()

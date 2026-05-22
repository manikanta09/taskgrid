# TaskGrid — Future Extensibility & AI Workflow Roadmap

## Architectural Principles for Extensibility

The MVP is deliberately designed with seams at the right places:

| MVP Design Choice | Why It Enables Growth |
|-------------------|-----------------------|
| Service layer separates routing from logic | AI agents can call services directly, bypassing HTTP |
| `payload` + `outcome_data` as JSON columns | Arbitrary data per workflow type without schema changes |
| `steps` JSON on workflow | Step config can gain new keys (e.g., `agent_id`, `auto_approve`) without migration |
| Audit log with `before_state`/`after_state` | Training data for AI models; full event sourcing replay |
| Status machine is code, not hardcoded | New statuses (e.g., `AI_PROCESSING`) require adding to enum |
| Repository pattern | Swap SQLite → Postgres by changing the engine string |

---

## Phase 2: Production Hardening (~1-2 weeks)

### Infrastructure
- Replace SQLite with **PostgreSQL**
- Add **Redis** for session store and cache
- Add **Celery + Redis** for async task processing
- Deploy on **Kubernetes** with HPA

### Features
- Real-time notifications via **WebSocket** (task assigned, approval needed)
- Email notifications on assignment and approval decisions
- File attachment support (S3/MinIO)
- Automated SLA escalation (Celery beat job)
- CSV/PDF export for audit logs

### Auth
- **Google OAuth / SAML** SSO integration
- Multi-factor authentication (TOTP)
- API key management for service-to-service calls

---

## Phase 3: Multi-Tenancy (~2-3 weeks)

### Organization Model
```
Organization
  └──< Teams
         └──< Users
  └──< Workflows (scoped to org)
  └──< Tasks (scoped to org)
```

### Changes Required
- Add `org_id` FK to all major entities
- Add org-level admin role
- Tenant isolation in all repository queries
- Subdomain routing (`acme.taskgrid.io`)

---

## Phase 4: AI Workflow Engine (~3-4 weeks)

This is the highest-value differentiator. The MVP's clean service layer makes this a natural extension.

### 4.1 AI-Powered Task Routing

**Concept:** When a task is created, an AI agent analyzes the payload and routes it to the most appropriate operator, or auto-completes trivial tasks.

```python
# New service: services/ai_routing_service.py

class AIRoutingService:
    def suggest_assignee(self, task: Task) -> User:
        # Call Claude API with task payload + operator skill profiles
        # Return ranked list of operators
        ...

    def auto_approve(self, task: Task) -> bool:
        # For low-risk tasks, AI reviews and auto-approves
        # Logs decision with confidence score to audit log
        ...
```

**Workflow step config extension:**
```json
{
  "step": 1,
  "name": "Document Classification",
  "assignee_role": "operator",
  "ai_assist": {
    "enabled": true,
    "model": "claude-sonnet-4-6",
    "prompt_template": "classify_document_v1",
    "auto_complete_threshold": 0.95
  }
}
```

### 4.2 AI Task Summarization

Add `GET /tasks/{id}/ai-summary` endpoint:
- Reads task payload + outcome data + timeline
- Returns structured summary for manager review
- Highlights anomalies or risks

### 4.3 Intelligent Approval Assistance

When a task reaches `PENDING_APPROVAL`:
- AI pre-screens task data against approval policy rules
- Surfaces a recommendation: **Approve / Review Carefully / Reject**
- Shows confidence score + reasoning to approver
- Approver makes final human decision

```python
# services/approval_service.py — extended
def get_ai_recommendation(self, task_id: int) -> ApprovalRecommendation:
    task = self.task_repo.get(task_id)
    prompt = build_approval_prompt(task)
    response = anthropic.messages.create(
        model="claude-sonnet-4-6",
        messages=[{"role": "user", "content": prompt}]
    )
    return parse_recommendation(response)
```

### 4.4 Workflow Definition Assistant

**Concept:** Manager describes a business process in plain English; AI generates the workflow step config.

```
User: "I need a 3-step process for expense reimbursements under $500: 
       finance team reviews receipts, manager approves, accounting processes payment."

AI:   Generates WorkflowCreate JSON with 3 steps, roles, SLA hours, and instructions.
      User reviews and publishes.
```

Endpoint: `POST /ai/workflows/generate`

### 4.5 Anomaly Detection

Background job that:
- Monitors task completion patterns
- Flags unusual rejection rates per workflow
- Detects SLA breach patterns
- Surfaces alerts to admin dashboard

---

## Phase 5: Advanced Orchestration (~4-6 weeks)

### Conditional Branching
```json
{
  "step": 2,
  "name": "Amount-Based Routing",
  "type": "conditional",
  "conditions": [
    { "if": "payload.amount > 10000", "goto_step": 3 },
    { "if": "payload.amount <= 10000", "goto_step": 4 }
  ]
}
```

### Parallel Steps
Multiple steps that must all complete before the next step begins.

### Sub-Workflows
A step can trigger another workflow instance, enabling nested business processes.

### External Integrations
- **Webhook triggers:** External systems create tasks via signed webhook
- **Outbound webhooks:** Notify external systems on task events
- **Zapier / Make connector:** No-code integration layer

---

## Database Migration Path

```
SQLite (MVP)
    │ Change DATABASE_URL in .env
    ▼
PostgreSQL (Phase 2)
    │ Add read replica
    ▼
PostgreSQL + Read Replica (Phase 3)
    │ Partition audit_logs by month
    ▼
PostgreSQL + TimescaleDB for analytics (Phase 4)
```

---

## Event-Driven Architecture Path

```
MVP: Direct function calls (synchronous)
    │
    ▼
Phase 2: Internal event bus (in-process observer pattern)
    │
    ▼
Phase 3: Redis Pub/Sub (cross-process events)
    │
    ▼
Phase 4: Kafka (durable event log, AI training pipeline integration)
```

The `audit_logs` table already acts as a lightweight event store — it can be replayed to rebuild state or feed a streaming system later.

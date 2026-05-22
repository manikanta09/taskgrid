import type { User } from './user';
import type { Workflow } from './workflow';

export type TaskStatus =
  | 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS'
  | 'PENDING_APPROVAL' | 'COMPLETED' | 'REJECTED'
  | 'ESCALATED' | 'CANCELLED';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: number;
  title: string;
  workflow_id: number;
  workflow?: Workflow;
  current_step: number;
  status: TaskStatus;
  priority: TaskPriority;
  payload: Record<string, unknown> | null;
  outcome_data: Record<string, unknown> | null;
  due_at: string | null;
  created_by: User;
  current_assignee: User | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  workflow_id?: number;
  assignee_id?: number;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'due_at';
  sort_dir?: 'asc' | 'desc';
}

export interface SubmitTaskRequest {
  outcome: string;
  notes?: string;
  outcome_data?: Record<string, unknown>;
}

export interface EscalateTaskRequest {
  reason: string;
}

export interface TimelineEntry {
  id: number;
  action: string;
  actor_id: number | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export interface Approval {
  id: number;
  task_id: number;
  decision: 'APPROVED' | 'REJECTED';
  comment: string | null;
  step: number;
  approver: User;
  decided_at: string;
}

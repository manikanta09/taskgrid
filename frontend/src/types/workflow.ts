import type { User } from './user';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface WorkflowStep {
  step: number;
  name: string;
  assignee_role: string;
  sla_hours?: number;
  instructions?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowListResponse {
  items: Workflow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TriggerWorkflowRequest {
  title?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  payload?: Record<string, unknown>;
}

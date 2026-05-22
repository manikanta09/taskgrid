import { apiClient } from './client';
import type { Workflow, WorkflowCreate, WorkflowListResponse, TriggerWorkflowRequest } from '../types/workflow';
import type { TaskListResponse } from '../types/task';

export const workflowsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<WorkflowListResponse>('/workflows', { params }).then((r) => r.data),

  get: (id: number) => apiClient.get<Workflow>(`/workflows/${id}`).then((r) => r.data),

  create: (data: WorkflowCreate) =>
    apiClient.post<Workflow>('/workflows', data).then((r) => r.data),

  publish: (id: number) =>
    apiClient.post<Workflow>(`/workflows/${id}/publish`).then((r) => r.data),

  archive: (id: number) =>
    apiClient.post<Workflow>(`/workflows/${id}/archive`).then((r) => r.data),

  trigger: (id: number, data: TriggerWorkflowRequest) =>
    apiClient.post(`/workflows/${id}/trigger`, data).then((r) => r.data),

  tasks: (id: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<TaskListResponse>(`/workflows/${id}/tasks`, { params }).then((r) => r.data),
};

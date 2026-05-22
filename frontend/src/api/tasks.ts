import { apiClient } from './client';
import type { Task, TaskListResponse, TaskFilter, SubmitTaskRequest, EscalateTaskRequest, TimelineEntry, Approval } from '../types/task';

export const tasksApi = {
  list: (filters?: TaskFilter) =>
    apiClient.get<TaskListResponse>('/tasks', { params: filters }).then((r) => r.data),

  mine: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<TaskListResponse>('/tasks/mine', { params }).then((r) => r.data),

  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`).then((r) => r.data),

  assign: (id: number, user_id: number) =>
    apiClient.post<Task>(`/tasks/${id}/assign`, { user_id }).then((r) => r.data),

  claim: (id: number) => apiClient.post<Task>(`/tasks/${id}/claim`).then((r) => r.data),

  start: (id: number) => apiClient.post<Task>(`/tasks/${id}/start`).then((r) => r.data),

  submit: (id: number, data: SubmitTaskRequest) =>
    apiClient.post<Task>(`/tasks/${id}/submit`, data).then((r) => r.data),

  complete: (id: number) => apiClient.post<Task>(`/tasks/${id}/complete`).then((r) => r.data),

  escalate: (id: number, data: EscalateTaskRequest) =>
    apiClient.post<Task>(`/tasks/${id}/escalate`, data).then((r) => r.data),

  cancel: (id: number) => apiClient.post<Task>(`/tasks/${id}/cancel`).then((r) => r.data),

  timeline: (id: number) =>
    apiClient.get<TimelineEntry[]>(`/tasks/${id}/timeline`).then((r) => r.data),

  approvalHistory: (id: number) =>
    apiClient.get<Approval[]>(`/approvals/${id}/history`).then((r) => r.data),
};

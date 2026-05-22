import { apiClient } from './client';
import type { Task, Approval } from '../types/task';

export const approvalsApi = {
  pending: () => apiClient.get<Task[]>('/approvals/pending').then((r) => r.data),

  approve: (taskId: number, comment?: string) =>
    apiClient.post<Approval>(`/approvals/${taskId}/approve`, { comment }).then((r) => r.data),

  reject: (taskId: number, reason: string) =>
    apiClient.post<Approval>(`/approvals/${taskId}/reject`, { reason }).then((r) => r.data),

  history: (taskId: number) =>
    apiClient.get<Approval[]>(`/approvals/${taskId}/history`).then((r) => r.data),
};

export const adminApi = {
  stats: () => apiClient.get('/admin/stats').then((r) => r.data),

  auditLogs: (params?: { page?: number; limit?: number; entity_type?: string }) =>
    apiClient.get('/admin/audit-logs', { params }).then((r) => r.data),
};

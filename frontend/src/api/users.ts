import { apiClient } from './client';
import type { User, UserCreate, UserUpdate, UserListResponse } from '../types/user';

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<UserListResponse>('/users', { params }).then((r) => r.data),

  get: (id: number) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) =>
    apiClient.post<User>('/users', data).then((r) => r.data),

  update: (id: number, data: UserUpdate) =>
    apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    apiClient.post<User>(`/users/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: number) =>
    apiClient.post<User>(`/users/${id}/reactivate`).then((r) => r.data),
};

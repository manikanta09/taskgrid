import { apiClient } from './client';
import type { LoginRequest, TokenResponse } from '../types/auth';
import type { User } from '../types/user';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
};

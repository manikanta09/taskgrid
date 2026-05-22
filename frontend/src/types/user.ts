export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface UserUpdate {
  full_name?: string;
  role?: UserRole;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

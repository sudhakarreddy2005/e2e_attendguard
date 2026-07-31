export type UserRole =
  | 'SUPER_ADMIN'
  | 'PRINCIPAL'
  | 'HOD'
  | 'DEO'
  | 'SECURITY'
  | 'STUDENT'
  | string;

export interface User {
  username: string;
  role: UserRole;
  display_name?: string;
  email?: string;
  department?: string;
  profile_photo?: string;
  designation?: string;
  permissions?: string[];
  auth_provider?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type UserRole =
  | 'super_admin'
  | 'principal'
  | 'hod'
  | 'faculty'
  | 'security'
  | 'deo'
  | 'student'
  | 'admin';

export interface User {
  username: string;
  role: UserRole;
  display_name?: string;
  email?: string;
  department?: string;
  profile_photo?: string;
  designation?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

import { apiClient } from './api';

export const authService = {
  microsoftLogin: async (idToken: string): Promise<any> => {
    const res = await apiClient.post('/api/auth/microsoft', { id_token: idToken });
    return res.data;
  },

  login: async (username: string, password: string): Promise<any> => {
    const res = await apiClient.post('/api/auth/login', { username, password });
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<any> => {
    const res = await apiClient.post('/api/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },

  getCurrentUser: async (): Promise<any> => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },

  // User Management Services (Super Admin)
  listUsers: async (): Promise<any> => {
    const res = await apiClient.get('/api/users/');
    return res.data;
  },

  inviteUser: async (userData: {
    email: string;
    role: string;
    name?: string;
    department?: string;
    designation?: string;
  }): Promise<any> => {
    const res = await apiClient.post('/api/users/invite', userData);
    return res.data;
  },

  updateUserRole: async (email: string, role: string): Promise<any> => {
    const res = await apiClient.patch(`/api/users/${encodeURIComponent(email)}/role`, { role });
    return res.data;
  },

  toggleUserStatus: async (email: string, isActive: boolean): Promise<any> => {
    const res = await apiClient.patch(`/api/users/${encodeURIComponent(email)}/status`, { is_active: isActive });
    return res.data;
  },

  deleteUser: async (email: string): Promise<any> => {
    const res = await apiClient.delete(`/api/users/${encodeURIComponent(email)}`);
    return res.data;
  },

  getAuditLogs: async (): Promise<any> => {
    const res = await apiClient.get('/api/users/audit-logs');
    return res.data;
  },
};

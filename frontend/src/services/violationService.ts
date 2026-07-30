import { apiClient } from './api';
import { Violation, CreateViolationInput } from '../types/violation';

export const violationService = {
  getViolations: async (): Promise<Violation[]> => {
    const res = await apiClient.get('/api/violations/');
    return res.data;
  },

  createViolation: async (input: CreateViolationInput): Promise<{ success: boolean; id: string }> => {
    const res = await apiClient.post('/api/violations/', input);
    return res.data;
  },

  deleteViolation: async (id: string): Promise<boolean> => {
    const res = await apiClient.delete(`/api/violations/${id}`);
    return res.data.success;
  },

  updateStatus: async (id: string, status: string): Promise<boolean> => {
    const res = await apiClient.patch(`/api/violations/${id}/status`, { status });
    return res.data.success;
  },
};

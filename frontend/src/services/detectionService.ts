import { apiClient } from './api';
import { DetectionResult } from '../types/detection';

export const detectionService = {
  matchFace: async (formData: FormData): Promise<DetectionResult> => {
    const res = await apiClient.post('/api/detection/match', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

import { apiClient } from './api';

export const aiService = {
  queryAssistant: async (prompt: string): Promise<any> => {
    const res = await apiClient.post('/api/ai/query', { query: prompt });
    return res.data;
  },
};

import { apiClient } from './api';
import { DashboardKPIs } from '../types/analytics';

export const analyticsService = {
  getDashboardKPIs: async (): Promise<DashboardKPIs> => {
    const res = await apiClient.get('/api/dashboard/kpis');
    return res.data.data;
  },

  getReportData: async (groupBy: string = 'type'): Promise<any> => {
    const res = await apiClient.get(`/api/reports/?group_by=${groupBy}`);
    return res.data;
  },
};

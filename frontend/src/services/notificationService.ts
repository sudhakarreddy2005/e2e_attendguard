import { apiClient } from './api';

export interface NotificationHistoryItem {
  _id: string;
  roll_number?: string;
  student_name?: string;
  notification_level?: number;
  delivery_status?: string;
  recipient?: string;
  sent_at?: string;
  subject?: string;
  academic_year?: string;
  semester?: string;
}

export const notificationService = {
  getHistory: async (limit: number = 30): Promise<NotificationHistoryItem[]> => {
    const res = await apiClient.get(`/api/notifications/history?limit=${limit}`);
    return res.data?.data || [];
  },
};

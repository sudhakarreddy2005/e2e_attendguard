export interface RecentActivityItem {
  roll_no: string;
  type: string;
  remarks: string;
  location: string;
  status: string;
  time: string;
  badge: 'critical' | 'warning' | 'info';
  dot: 'red' | 'orange' | 'blue';
}

export interface DashboardKPIs {
  total_students: number;
  total_violations: number;
  today_activity: number;
  recognition_accuracy: number;
  unknown_faces_today: number;
  monthly_chart: {
    labels: string[];
    data: number[];
  };
  most_active_location: {
    name: string;
    count: number;
  };
  dept_breakdown: {
    labels: string[];
    data: number[];
  };
  type_breakdown: {
    labels: string[];
    data: number[];
  };
  recent_activity: RecentActivityItem[];
  weekly_trends: {
    labels: string[];
    data: number[];
  };
}

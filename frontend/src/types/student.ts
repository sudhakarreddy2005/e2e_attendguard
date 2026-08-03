export interface ContactInfo {
  phone: string;
  email: string;
}

export interface FaceRegistration {
  image_filenames: string[];
  registration_status: 'pending_image' | 'processing' | 'active' | 'failed';
  image_count: number;
}

export interface Student {
  _id?: string;
  roll_no: string;
  name: string;
  department: string;
  section: string;
  year?: string;
  academic_year?: string;
  current_semester?: string;
  semester_violations?: Record<string, number>;
  contact_info?: ContactInfo;
  face?: FaceRegistration;
  violations_count: number;
  late_count: number;
  bunk_count: number;
  dress_code_count: number;
  attendance_percentage: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentAnalytics {
  total: number;
  monthly_counts: {
    labels: string[];
    data: number[];
  };
  breakdown: Record<string, number>;
  timeline: Array<{
    id: string;
    type: string;
    date: string;
    remark: string;
    location: string;
    status: string;
  }>;
}

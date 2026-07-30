export interface Violation {
  _id: string;
  roll_no: string;
  student_name?: string;
  type: 'Late Arrival' | 'Dress Code' | 'Bunk' | string;
  location: string;
  department: string;
  section: string;
  remarks: string;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Escalated';
  confidence?: number;
  date?: string;
  iso_date?: string;
  created_at?: string;
}

export interface CreateViolationInput {
  roll_no: string;
  type: string;
  location: string;
  department: string;
  section: string;
  remarks: string;
  status?: string;
  confidence?: number;
}

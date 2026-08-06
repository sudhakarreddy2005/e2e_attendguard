export type IncidentStatus =
  | 'Detected'
  | 'Under Review'
  | 'Verified'
  | 'Action Taken'
  | 'Closed'
  | 'Dismissed'
  | 'Pending'
  | 'Reviewed'
  | 'Resolved'
  | 'Escalated';

export interface RecipientNotificationState {
  status: 'Queued' | 'Sent' | 'Delivered' | 'Opened' | 'Acknowledged' | 'Failed';
  open_time?: string;
  ack_time?: string;
  mode?: 'Live' | 'Shadow' | 'Dry Run';
  provider?: string;
  retries?: number;
  failure_reason?: string;
}

export interface NotificationLifecycle {
  student: RecipientNotificationState;
  counsellor: RecipientNotificationState;
  committee: RecipientNotificationState;
}

export interface AuditTrailEvent {
  timestamp: string;
  action: string;
  user: string;
  role: string;
  ip?: string;
  device?: string;
}

export interface Violation {
  _id: string;
  roll_no: string;
  student_name?: string;
  type: 'Late Arrival' | 'Dress Code' | 'Bunk' | string;
  location: string;
  department: string;
  section: string;
  remarks: string;
  status: IncidentStatus;
  confidence?: number;
  camera_id?: string;
  building?: string;
  academic_year?: string;
  semester?: string;
  detection_method?: string;
  captured_image?: string;
  created_at?: string;
  date?: string;
  iso_date?: string;
  reviewed_by?: string;
  ai_risk_score?: number;
  ai_summary?: string;
  similarity_score?: number;
  embedding_version?: string;
  recognition_model?: string;
  notification_channels?: NotificationLifecycle;
  audit_trail?: AuditTrailEvent[];
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
  captured_image?: string;
  building?: string;
  camera_id?: string;
}

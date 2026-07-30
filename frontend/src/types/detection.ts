export interface FaceMatch {
  roll_no: string;
  name: string;
  department: string;
  section: string;
  confidence: number;
  similarity: number;
  violations_count: number;
  bbox?: [number, number, number, number];
}

export interface DetectionResult {
  success: boolean;
  matched: boolean;
  student?: FaceMatch;
  matches: FaceMatch[];
  faces_detected: number;
  reason?: string;
  captured_filename?: string;
  threshold: number;
  detection_ms?: number;
  recognition_ms?: number;
  total_ms?: number;
}

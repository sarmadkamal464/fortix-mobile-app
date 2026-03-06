import { PaginationState } from "../users";

export interface DetectedObject {
  class_id: number;
  bbox: number[];
  class_name: number;
  confidence: number;
  tracker_id?: number;
}

export interface ConfidenceScore {
  class_id: number;
  class_name: number;
  confidence: number;
}

export interface Alarm {
  id: number;
  stream_id: number;
  user_id: number;
  business_case_id: number;
  video_source_id: number;
  alert_type: string;
  alert_content: string;
  detected_objects: DetectedObject[];
  confidence_scores: ConfidenceScore[];
  image_s3_url?: string;
  video_s3_url?: string;
  image_urls?: string[];
  alarm_date: string;
  alarm_time: string;
  full_timestamp: string;
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  examine_result?: string;
  examined_by?: number;
  examined_at?: string;
  email_sent: boolean;
  push_notification_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from backend
  site?: Site;
  site_id?: number;
  stream_status?: string;
  video_source_name?: string;
  video_source_type?: string;
  business_case_name?: string;
  business_case_type?: string;
  examined_by_username?: string;
}

export interface AlarmFilters {
  stream_id?: number;
  site_id?: number;
  user_id?: number;
  business_case_id?: number;
  video_source_id?: number;
  alert_type?: string;
  status?: "active" | "acknowledged" | "resolved" | "dismissed";
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  examine_result?: string;
  video_alarms?: boolean;
  search?: string;
}

export interface AlarmState {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
  filterOptions: {
    sites: Site[];
    businessUseCases: BusinessCase[];
    cameras: VideoSource[];
  };
  pagination: PaginationState;
  selectedAlarms: number[];
}

export interface AlarmStatistics {
  total_alarms: number;
  active_alarms: number;
  resolved_alarms: number;
  dismissed_alarms: number;
  acknowledged_alarms: number;
  by_alert_type: Record<string, number>;
  by_date: Record<string, number>;
}

export interface CreateAlarmRequest {
  stream_id: number;
  user_id: number;
  business_case_id: number;
  video_source_id: number;
  alert_type: string;
  alert_content: string;
  detected_objects: DetectedObject[];
  confidence_scores: ConfidenceScore[];
  image_s3_url?: string;
  video_s3_url?: string;
  image_urls?: string[];
  alarm_date: string;
  alarm_time: string;
  full_timestamp: string;
  email_sent?: boolean;
  push_notification_sent?: boolean;
}

export interface UpdateAlarmStatusRequest {
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  examine_result?: string;
  examined_by?: number;
}

export interface BulkUpdateAlarmStatusRequest {
  alarm_ids: number[];
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  examine_result?: string;
  examined_by?: number;
}

export interface AlarmResponse {
  success: boolean;
  message: string;
  data?: Alarm | Alarm[] | AlarmStatistics;
  total?: number;
  page?: number;
  limit?: number;
}

export type AlarmStatus = "active" | "acknowledged" | "resolved" | "dismissed";
export type ExamineResult =
  | "Wait Examining Manually"
  | "Confirmed"
  | "False Positive"
  | "Under Review";

export interface ChatMessage {
  id: number;
  sender_type: "user" | "ai";
  message: string;
  video_url?: string;
  created_at: string;
}

export interface VideoAnalysis {
  id: number;
  video_url: string;
  video_title?: string;
  analysis: any;
  created_at: string;
}

export interface AlarmReportingData {
  data: {
    chatMessages: ChatMessage[];
    videoAnalysis: VideoAnalysis[];
  };
}

export interface ReportResponse {
  user_prompt: string;
  ai_response: string;
  video_summary?: string;
  video_analysis?: any;
  analysis_id?: number;
}

export interface RequestData {
  user_prompt: string;
  user_id: number;
  alarm_id: number;
  video_url?: string;
  video_analysis?: string;
}

export interface AlarmFeedbackFormData {
  is_accurate: boolean;
  feedback: string;
}

export interface VideoSource {
  id: number;
  name: string;
  status: "active" | "inactive";
  business_case_id: number;
  business_case_name?: string;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  pagination: PaginationState;
}

export interface BusinessCase {
  id: number;
  name: string;
  business_case_type: string;
  confidence_threshold: number;
  created_at: Date;
  updated_at: Date;
}

export interface Site {
  id: number;
  name: string;
  location: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  camera_count?: number;
  cameras?: Partial<VideoSource>[];
}

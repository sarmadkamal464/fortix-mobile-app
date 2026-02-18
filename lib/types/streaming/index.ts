import { PaginationState } from "@/lib/types/users";
import { User } from "../auth";
import { Site } from "../alarm";
export interface StreamUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface StreamBusinessCase {
  id: number;
  name: string;
  business_case_type: string;
  confidence_threshold: number;
  created_at: string;
  updated_at: string;
}
export interface StreamConfiguration {
  id: number;
  name: string;
  confidence_threshold: number;
  created_at: string;
  updated_at: string;
}
export interface StreamVideoSource {
  id: number;
  name: string;
  source_type: string;
  credentials: any;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface Stream {
  id: number;
  user_id: number;
  business_case_id: number;
  configuration_ids: Array<number>;
  video_source_id: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  user: StreamUser;
  site: Site,
  site_id: number,
  business_case: StreamBusinessCase;
  configurations: StreamConfiguration[];
  video_source: StreamVideoSource;
}
export interface FilterOption {
  id: number;
  name: string;
}

export interface StreamFilters {
  sites: FilterOption[];
  businessCases: FilterOption[];
}

export interface StreamState {
  streams: Stream[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters?: StreamFilters;
  activeStreams: number,
  inactiveStreams: number,
}

export interface UserHasAssignedGPU {
  id?: number;
  user_id: number;
  user: User;
  gpu_id: string;
  pod_id: string;
  own_gpu_id: number;
  created_at?: string;
}

export interface RealTimePreviewFiltersQuery {
  business_case_id?: number;
  site_id?: number;
  page?: number;
  limit?: number;
  search?: string;
}
// Common types used across the application
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export interface SearchFilters {
  search?: string;
}

export interface ApiResponse<T> extends PaginationResponse {
  data: T[];
}

export interface DataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

export interface BaseEntity {
  _id: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileDetails {
  user_id: string;
  full_name: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  address: string;
  phone_number: string;
  class_id: string | null;
  department_id: string | null;
  start_year: number | null;
  end_year: number | null;
  profile_picture_url: string | null;
  profile_picture_key: string | null;
  created_at: string;
  updated_at: string;
  _id: string;
}

export interface ExpertiseProgram extends BaseEntity {
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
}

export interface AcademicPeriod extends BaseEntity {
  year: string;
  semester: string;
  status: string;
  start_date: string;
  end_date: string;
}
import { BaseEntity, PaginationParams, PaginationResponse, SearchFilters, ExpertiseProgram } from './common';
import { Teacher } from './user';

export interface Class extends BaseEntity {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  homeroom_teacher_details?: HomeroomTeacherDetails;
  expertise_details?: ExpertiseProgram;
}

export interface HomeroomTeacherDetails {
  _id: string;
  full_name: string;
  gender: string;
  profile_picture_url: string | null;
}

export interface ClassResponse extends PaginationResponse {
  data: Class[];
  grade_10_total: number;
  grade_11_total: number;
  grade_12_total: number;
}

export interface ClassFilters extends SearchFilters, PaginationParams {
  grade_level?: string;
  expertise_id?: string;
  academic_year?: string;
}

export interface CreateClassRequest {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
}

export interface UpdateClassRequest {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
}

export interface ClassStudent extends BaseEntity {
  login_id: string;
  email: string;
  is_active: boolean;
  roles: string[];
  profile_id: string;
  class_id: string;
  department_id: string;
  onboarding_completed: boolean;
  password_last_changed_at: string | null;
  profile_details?: {
    user_id: string;
    full_name: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    address: string;
    phone_number: string;
    class_id: string;
    department_id: string;
    start_year: number | null;
    end_year: number | null;
    profile_picture_url: string | null;
    profile_picture_key: string | null;
    created_at: string;
    updated_at: string;
    _id: string;
  };
}

export interface TeacherResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Teacher[];
}
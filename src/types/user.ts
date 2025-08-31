import { BaseEntity, DataTableResponse, SearchFilters, ExpertiseProgram } from './common';

// Base User Interface
export interface BaseUser extends BaseEntity {
  login_id: string;
  email: string;
  is_active: boolean;
  roles: string[];
  profile_id: string;
  class_id: string | null;
  department_id: string | null;
  onboarding_completed: boolean;
  password_last_changed_at: string | null;
  profile_details?: ProfileDetails | null;
  class_details?: ClassDetails | null;
  department_details?: ExpertiseProgram | null;
}

// Teacher specific types
export interface Teacher extends BaseUser {
  teaching_summary: TeachingSummary[];
  department_details: ExpertiseProgram; // Teachers always have department
}

// Basic Teacher for assignment matrix (optimized payload)
export interface BasicTeacher {
  _id: string;
  full_name: string;
  profile_picture_key: string | null;
}

export interface TeachingSummary {
  subject_name: string;
  class_name: string;
}

export interface TeacherFilters extends SearchFilters {
  expertise_id?: string;
}

export interface CreateTeacherRequest {
  login_id: string;
  email: string;
  roles: string[];
  is_active: boolean;
  profile: CreateTeacherProfileRequest;
}

export interface UpdateTeacherRequest {
  login_id?: string;
  email?: string;
  is_active?: boolean;
  roles?: string[];
  profile?: Partial<CreateTeacherProfileRequest>;
}

export interface CreateTeacherProfileRequest {
  full_name: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  address: string;
  phone_number: string;
  department_id: string; // Required for teachers
  start_year?: number;
  end_year?: number;
}

// Student specific types
export interface Student extends BaseUser {
  class_details?: StudentClassDetails | null;
  // Students don't have teaching_summary or direct department_details
  // Department info comes from class_details.expertise_details
}

export interface StudentClassDetails {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  _id: string;
  homeroom_teacher_details?: {
    _id: string;
    full_name: string;
    gender: string;
    profile_picture_url: string | null;
  };
  expertise_details: ExpertiseProgram;
}

export interface StudentFilters extends SearchFilters {
  grade_level?: string;
  expertise_id?: string;
  class_id?: string;
}

export interface CreateStudentRequest {
  login_id: string;
  email: string;
  roles: string[];
  is_active: boolean;
  profile: CreateStudentProfileRequest;
}

export interface UpdateStudentRequest {
  login_id?: string;
  email?: string;
  is_active?: boolean;
  roles?: string[];
  profile?: Partial<CreateStudentProfileRequest>;
}

export interface CreateStudentProfileRequest {
  full_name: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  address: string;
  phone_number: string;
  class_id?: string; // Optional for students
  start_year?: number;
  end_year?: number;
}

// Profile related types
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

// Class details for users
export interface ClassDetails {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  _id: string;
  expertise_details?: ExpertiseProgram;
}

// Response types with new pagination format
export interface UserResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: (Teacher | Student)[];
}

export type TeacherResponse = UserResponse;
export type StudentResponse = UserResponse;
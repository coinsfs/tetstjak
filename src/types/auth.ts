export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  login_id: string;
  email: string;
  is_active: boolean;
  roles: string[];
  profile_id: string;
  class_id: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  password_last_changed_at: string;
  _id: string;
  class_details?: {
    grade_level: number;
    expertise_id: string;
    name: string;
    academic_year: string;
    homeroom_teacher_id: string;
    _id: string;
  };
  department_details?: {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    _id: string;
  };
  teaching_summary?: any;
}

export interface AuthError {
  detail: string;
}
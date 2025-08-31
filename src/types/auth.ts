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
  password_last_changed_at: string | null;
  _id: string;
  profile_details?: {
    user_id: string;
    full_name: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    address: string;
    phone_number: string;
    class_id: string | null;
    department_id: string;
    start_year: number | null;
    end_year: number | null;
    profile_picture_url: string | null;
    profile_picture_key: string;
    created_at: string;
    updated_at: string;
    _id: string;
  };
  class_details?: {
    grade_level: number;
    expertise_id: string;
    name: string;
    academic_year: string;
    homeroom_teacher_id: string;
    expertise_details: {
      name: string;
      abbreviation: string;
      description: string;
      _id: string;
    } | null;
    _id: string;
  } | null;
  department_details?: {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    head_of_department_details: any | null;
    _id: string;
  } | null;
  teaching_summary?: any | null;
}

export interface AuthError {
  detail: string;
}
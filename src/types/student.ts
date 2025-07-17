export interface Student {
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
  profile_details: {
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
  } | null;
  class_details: {
    grade_level: number;
    expertise_id: string;
    name: string;
    academic_year: string;
    homeroom_teacher_id: string;
    _id: string;
  } | null;
  department_details: {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    _id: string;
  } | null;
  teaching_summary: any[];
}

export interface StudentResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Student[];
}

export interface StudentFilters {
  search?: string;
  grade_level?: string;
  expertise_id?: string;
  class_id?: string;
}

export interface StudentPagination {
  currentPage: number;
  recordsPerPage: number;
  totalRecords: number;
  totalPages: number;
  start: number;
}

export interface CreateStudentRequest {
  login_id: string;
  email: string;
  roles: string[];
  is_active: boolean;
  profile: {
    full_name: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    address: string;
    phone_number: string;
    class_id?: string;
    department_id?: string;
    start_year?: number;
    end_year?: number;
  };
}

export interface UpdateStudentRequest {
  login_id?: string;
  email?: string;
  is_active?: boolean;
  roles?: string[];
  profile?: {
    full_name?: string;
    gender?: string;
    birth_date?: string;
    birth_place?: string;
    address?: string;
    phone_number?: string;
    class_id?: string;
    department_id?: string;
    start_year?: number;
    end_year?: number;
  };
}

export interface ExpertiseProgram {
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
  _id: string;
}

export interface ClassData {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  _id: string;
  homeroom_teacher_details: any;
  expertise_details: {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    _id: string;
  };
}
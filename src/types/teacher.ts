export interface Teacher {
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
    teaching_summary: {
      subject_name: string;
      class_name: string;
    }[];
  }
  
  export interface TeacherResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: Teacher[];
  }
  
  export interface TeacherFilters {
    search?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'all';
    onboarding?: 'completed' | 'pending' | 'all';
  }
  
  export interface CreateTeacherRequest {
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
    };
  }
  
  export interface UpdateTeacherRequest {
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
    };
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
  
  export interface DepartmentData {
    name: string;
    abbreviation: string;
    description: string;
    head_of_department_id: string;
    _id: string;
  }
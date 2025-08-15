import { BaseService } from './base';

export interface TeachingAssignment {
  name: string;
  code: string;
  description: string;
  teaching_assignment_id: string;
  subject_id: string;
}

export interface ClassDetails {
  _id: string;
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
}

export interface ExpertiseDetails {
  _id: string;
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
  head_of_department_details: any | null;
}

export interface TeachingClass {
  total_students: number;
  assignments: TeachingAssignment[];
  class_details: ClassDetails;
  expertise_details: ExpertiseDetails;
}

export interface TeachingSummaryResponse {
  classes: TeachingClass[];
  teaching_assignments: TeachingAssignment[];
}

export interface ClassStudent {
  _id: string;
  login_id: string;
  email: string;
  is_active: boolean;
  roles: string[];
  profile_id: string;
  class_id: string;
  department_id: string;
  onboarding_completed: boolean;
  password_last_changed_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface ClassStudentsResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: ClassStudent[];
}

class TeacherService extends BaseService {
  async getTeachingSummary(token: string): Promise<TeachingSummaryResponse> {
    return this.get<TeachingSummaryResponse>('/teaching-assignments/teacher/teaching-summary', token);
  }

  async getClassStudents(token: string, classId: string, search?: string): Promise<ClassStudentsResponse> {
    const params: any = { class_id: classId };
    if (search) {
      params.search = search;
    }
    
    const queryString = this.buildQueryParams(params);
    return this.get<ClassStudentsResponse>(`/users/teacher_view?${queryString}`, token);
  }
}

export const teacherService = new TeacherService();
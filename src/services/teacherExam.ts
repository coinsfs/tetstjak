import { BaseService } from './base';

export interface TeacherExam {
  _id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  settings: {
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_results_after_submission: boolean;
  };
  academic_period_id: string;
  teaching_assignment_id: string;
  proctor_ids: string[];
  teaching_assignment_details: any;
  academic_period_details: any;
  question_ids: string[];
}

export interface TeacherExamResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: TeacherExam[];
}

export interface CreateTeacherExamRequest {
  title: string;
  exam_type: 'quiz' | 'daily_test' | 'official_uts' | 'official_uas';
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  status: 'pending_questions';
  settings: {
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_results_after_submission: boolean;
  };
  academic_period_id: string;
  teaching_assignment_id: string;
  question_ids: string[];
  proctor_ids: string[];
}

export interface AcademicPeriod {
  _id: string;
  year: string;
  semester: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface TeacherExamFilters {
  academic_period_id?: string;
  class_id?: string;
  page?: number;
  limit?: number;
}

class TeacherExamService extends BaseService {
  async getTeacherExams(token: string, filters?: TeacherExamFilters): Promise<TeacherExamResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/exams/teacher?${queryString}` : '/exams/teacher';
    return this.get<TeacherExamResponse>(endpoint, token);
  }

  async createTeacherExam(token: string, data: CreateTeacherExamRequest): Promise<TeacherExam> {
    // Set academic_period_id to empty string if not provided
    const requestData = {
      ...data,
      academic_period_id: data.academic_period_id || ''
    };
    
    return this.post<TeacherExam>('/exams/', requestData, token);
  }

  async deleteTeacherExam(token: string, examId: string): Promise<void> {
    await this.delete(`/exams/${examId}`, token);
  }

  async getAcademicPeriods(token: string): Promise<AcademicPeriod[]> {
    return this.get<AcademicPeriod[]>('/academic-periods/', token);
  }
}

export const teacherExamService = new TeacherExamService();
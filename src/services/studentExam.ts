import { BaseService } from './base';

export interface StudentExam {
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

export interface StudentExamResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: StudentExam[];
}

export interface StudentExamFilters {
  academic_period_id: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AcademicPeriod {
  _id: string;
  year: string;
  semester: string;
  status: string;
  start_date: string;
  end_date: string;
}

class StudentExamService extends BaseService {
  async getStudentExams(token: string, filters: StudentExamFilters): Promise<StudentExamResponse> {
    const queryString = this.buildQueryParams(filters);
    const endpoint = `/exams/student?${queryString}`;
    return this.get<StudentExamResponse>(endpoint, token);
  }

  async getAcademicPeriods(token: string): Promise<AcademicPeriod[]> {
    return this.get<AcademicPeriod[]>('/academic-periods/', token);
  }

  async getActiveAcademicPeriod(token: string): Promise<AcademicPeriod | null> {
    try {
      return await this.get<AcademicPeriod>('/academic-periods/active', token);
    } catch (error) {
      console.error('No active academic period found:', error);
      return null;
    }
  }
}

export const studentExamService = new StudentExamService();
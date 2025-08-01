import { BaseService } from './base';

export interface QuestionSubmission {
  question_id: string;
  submitted_by_teacher_id: string;
  coordination_assignment_id: string;
  academic_period_id: string;
  purpose: string;
  status: 'submitted' | 'approved' | 'rejected';
  reviewer_comment: string | null;
  created_at: string;
  updated_at: string;
  _id: string;
  question_details: {
    subject_id: string;
    created_by_teacher_id: string;
    question_type: 'multiple_choice' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    question_text: string;
    options: QuestionOption[];
    points: number;
    tags: string[];
    status: string;
    _id: string;
  };
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuestionSubmissionFilters {
  academic_period_id?: string;
  search?: string;
  purpose?: string;
  question_type?: 'multiple_choice' | 'essay';
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'submitted' | 'approved' | 'rejected';
}

export interface AcademicPeriod {
  _id: string;
  year: string;
  semester: string;
  status: string;
  start_date: string;
  end_date: string;
}

class QuestionSubmissionService extends BaseService {
  async getSubmissionsForReview(token: string, filters?: QuestionSubmissionFilters): Promise<QuestionSubmission[]> {
    const params: Record<string, any> = {};
    
    if (filters?.academic_period_id) {
      params.academic_period_id = filters.academic_period_id;
    }
    
    if (filters?.search && filters.search.trim() !== '') {
      params.search = filters.search.trim();
    }
    
    if (filters?.purpose && filters.purpose.trim() !== '') {
      params.purpose = filters.purpose.trim();
    }
    
    if (filters?.question_type) {
      params.question_type = filters.question_type;
    }
    
    if (filters?.difficulty) {
      params.difficulty = filters.difficulty;
    }
    
    if (filters?.status) {
      params.status = filters.status;
    }
    
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString ? `/question-submissions/for-review?${queryString}` : '/question-submissions/for-review';
    
    return this.get<QuestionSubmission[]>(endpoint, token);
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

export const questionSubmissionService = new QuestionSubmissionService();
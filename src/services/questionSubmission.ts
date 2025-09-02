import { BaseService } from './base';

export interface QuestionSubmission {
  _id: string;
  question_id: string;
  teacher_id: string;
  academic_period_id: string;
  subject_id: string;
  grade_level: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  question_details: {
    question_type: 'multiple_choice' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    question_text: string;
    options?: QuestionOption[];
    correct_answer?: string;
    points: number;
    tags: string[];
  };
  teacher_details: {
    _id: string;
    full_name: string;
    profile_picture_key: string | null;
  };
  subject_details: {
    name: string;
    code: string;
  };
  reviewer_details?: {
    _id: string;
    full_name: string;
  };
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuestionSubmissionFilters {
  page?: number;
  limit?: number;
  academic_period_id?: string;
  search?: string;
  purpose?: string;
  question_type?: string;
  difficulty?: string;
  status?: string;
  subject_id?: string;
  grade_level?: number;
}

export interface QuestionSubmissionResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: QuestionSubmission[];
}

export interface AcademicPeriod {
  _id: string;
  year: string;
  semester: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface CreateQuestionSubmissionRequest {
  subject_id: string;
  grade_level: number;
  purpose: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options?: Omit<QuestionOption, 'id'>[];
  correct_answer?: string;
  points: number;
  tags: string[];
}

export interface UpdateQuestionSubmissionRequest {
  purpose?: string;
  question_type?: 'multiple_choice' | 'essay';
  difficulty?: 'easy' | 'medium' | 'hard';
  question_text?: string;
  options?: Omit<QuestionOption, 'id'>[];
  correct_answer?: string;
  points?: number;
  tags?: string[];
}

export interface ReviewQuestionSubmissionRequest {
  status: 'approved' | 'rejected';
  review_notes?: string;
}

class QuestionSubmissionService extends BaseService {
  async getMySubmissions(token: string, filters?: QuestionSubmissionFilters): Promise<QuestionSubmissionResponse | QuestionSubmission[]> {
    try {
      if (filters && (filters.page || filters.limit)) {
        // Use paginated endpoint
        const queryString = this.buildQueryParams(filters);
        const endpoint = `/question-submissions/my-submissions?${queryString}`;
        return this.get<QuestionSubmissionResponse>(endpoint, token);
      } else {
        // Fallback to non-paginated endpoint for backward compatibility
        const allSubmissions = await this.get<QuestionSubmission[]>('/question-submissions/my-submissions', token);
        
        // Apply client-side filtering if needed
        let filteredSubmissions = allSubmissions;
        
        if (filters?.search) {
          filteredSubmissions = filteredSubmissions.filter(s => 
            s.question_details.question_text.toLowerCase().includes(filters.search!.toLowerCase()) ||
            s.question_details.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
          );
        }
        
        if (filters?.difficulty) {
          filteredSubmissions = filteredSubmissions.filter(s => s.question_details.difficulty === filters.difficulty);
        }
        
        if (filters?.question_type) {
          filteredSubmissions = filteredSubmissions.filter(s => s.question_details.question_type === filters.question_type);
        }

        if (filters?.purpose) {
          filteredSubmissions = filteredSubmissions.filter(s => s.purpose === filters.purpose);
        }

        if (filters?.status) {
          filteredSubmissions = filteredSubmissions.filter(s => s.status === filters.status);
        }

        return filteredSubmissions;
      }
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      throw error;
    }
  }

  async getSubmissionsForReview(token: string, filters?: QuestionSubmissionFilters): Promise<QuestionSubmissionResponse | QuestionSubmission[]> {
    try {
      if (filters && (filters.page || filters.limit)) {
        // Use paginated endpoint
        const queryString = this.buildQueryParams(filters);
        const endpoint = `/question-submissions/for-review?${queryString}`;
        return this.get<QuestionSubmissionResponse>(endpoint, token);
      } else {
        // Fallback to non-paginated endpoint for backward compatibility
        const allSubmissions = await this.get<QuestionSubmission[]>('/question-submissions/for-review', token);
        
        // Apply client-side filtering if needed
        let filteredSubmissions = allSubmissions;
        
        if (filters?.academic_period_id) {
          filteredSubmissions = filteredSubmissions.filter(s => s.academic_period_id === filters.academic_period_id);
        }
        
        if (filters?.search) {
          filteredSubmissions = filteredSubmissions.filter(s => 
            s.question_details.question_text.toLowerCase().includes(filters.search!.toLowerCase()) ||
            s.question_details.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
          );
        }
        
        if (filters?.difficulty) {
          filteredSubmissions = filteredSubmissions.filter(s => s.question_details.difficulty === filters.difficulty);
        }
        
        if (filters?.question_type) {
          filteredSubmissions = filteredSubmissions.filter(s => s.question_details.question_type === filters.question_type);
        }

        if (filters?.purpose) {
          filteredSubmissions = filteredSubmissions.filter(s => s.purpose === filters.purpose);
        }

        if (filters?.status) {
          filteredSubmissions = filteredSubmissions.filter(s => s.status === filters.status);
        }

        return filteredSubmissions;
      }
    } catch (error) {
      console.error('Error fetching submissions for review:', error);
      throw error;
    }
  }

  async createSubmission(token: string, data: CreateQuestionSubmissionRequest): Promise<QuestionSubmission> {
    return this.post<QuestionSubmission>('/question-submissions/', data, token);
  }

  async updateSubmission(token: string, submissionId: string, data: UpdateQuestionSubmissionRequest): Promise<QuestionSubmission> {
    return this.put<QuestionSubmission>(`/question-submissions/${submissionId}`, data, token);
  }

  async reviewSubmission(token: string, submissionId: string, data: ReviewQuestionSubmissionRequest): Promise<QuestionSubmission> {
    return this.put<QuestionSubmission>(`/question-submissions/${submissionId}/review`, data, token);
  }

  async deleteSubmission(token: string, submissionId: string): Promise<void> {
    await this.delete(`/question-submissions/${submissionId}`, token);
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

  async getSubmissionById(token: string, submissionId: string): Promise<QuestionSubmission> {
    return this.get<QuestionSubmission>(`/question-submissions/${submissionId}`, token);
  }
}

export const questionSubmissionService = new QuestionSubmissionService();
import { BaseService } from './base';

export interface Question {
  _id: string;
  subject_id: string;
  created_by_teacher_id: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options?: QuestionOption[];
  correct_answer?: string;
  points: number;
  tags: string[];
  purpose: string;
  created_at: string;
  updated_at: string;
  subject_details?: {
    name: string;
    code: string;
  };
  created_by_details?: {
    full_name: string;
  };
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  question_type?: string;
  purpose?: string;
  subject_id?: string;
}

export interface QuestionResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: Question[];
}

export interface CreateQuestionRequest {
  subject_id: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options?: Omit<QuestionOption, 'id'>[];
  correct_answer?: string;
  points: number;
  tags: string[];
  purpose: string;
}

export interface UpdateQuestionRequest {
  subject_id?: string;
  question_type?: 'multiple_choice' | 'essay';
  difficulty?: 'easy' | 'medium' | 'hard';
  question_text?: string;
  options?: Omit<QuestionOption, 'id'>[];
  correct_answer?: string;
  points?: number;
  tags?: string[];
  purpose?: string;
}

class QuestionBankService extends BaseService {
  async getMyQuestions(token: string, filters?: QuestionFilters): Promise<QuestionResponse | Question[]> {
    try {
      if (filters && (filters.page || filters.limit)) {
        // Use paginated endpoint
        const queryString = this.buildQueryParams(filters);
        const endpoint = `/question-banks/my-questions?${queryString}`;
        return this.get<QuestionResponse>(endpoint, token);
      } else {
        // Fallback to non-paginated endpoint for backward compatibility
        const allQuestions = await this.get<Question[]>('/question-banks/my-questions', token);
        
        // Apply client-side filtering if needed
        let filteredQuestions = allQuestions;
        
        if (filters?.search) {
          filteredQuestions = filteredQuestions.filter(q => 
            q.question_text.toLowerCase().includes(filters.search!.toLowerCase()) ||
            q.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
          );
        }
        
        if (filters?.difficulty) {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
        }
        
        if (filters?.question_type) {
          filteredQuestions = filteredQuestions.filter(q => q.question_type === filters.question_type);
        }

        if (filters?.purpose) {
          filteredQuestions = filteredQuestions.filter(q => q.purpose === filters.purpose);
        }

        return filteredQuestions;
      }
    } catch (error) {
      console.error('Error fetching my questions:', error);
      throw error;
    }
  }

  async getQuestions(token: string, filters?: QuestionFilters): Promise<QuestionResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/question-banks/?${queryString}` : '/question-banks/';
    return this.get<QuestionResponse>(endpoint, token);
  }

  async createQuestion(token: string, data: CreateQuestionRequest): Promise<Question> {
    return this.post<Question>('/question-banks/', data, token);
  }

  async updateQuestion(token: string, questionId: string, data: UpdateQuestionRequest): Promise<Question> {
    return this.put<Question>(`/question-banks/${questionId}`, data, token);
  }

  async deleteQuestion(token: string, questionId: string): Promise<void> {
    await this.delete(`/question-banks/${questionId}`, token);
  }

  async getQuestionById(token: string, questionId: string): Promise<Question> {
    return this.get<Question>(`/question-banks/${questionId}`, token);
  }

  async getQuestionsByIds(token: string, questionIds: string[]): Promise<Question[]> {
    return this.post<Question[]>('/question-banks/by-ids', { ids: questionIds }, token);
  }
}

export const questionBankService = new QuestionBankService();
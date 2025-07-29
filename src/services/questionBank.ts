import { BaseService } from './base';

export interface Question {
  _id: string;
  subject_id: string;
  created_by_teacher_id: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: string;
  question_text: string;
  options: QuestionOption[];
  points: number;
  tags: string[];
  status: string;
}

export interface QuestionOption {
  id?: string;
  text: string;
  is_correct: boolean;
}

export interface CreateQuestionRequest {
  subject_id: string;
  created_by_teacher_id: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: QuestionOption[];
  points: number;
  tags: string[];
  status: 'private' | 'public';
}

export interface UpdateQuestionRequest {
  subject_id: string;
  question_type: 'multiple_choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: QuestionOption[];
  points: number;
  tags: string[];
}

export interface QuestionSet {
  _id: string;
  title: string;
  description: string;
  subject_id: string;
  grade_level: number;
  questions: Question[];
  created_by_details?: {
    full_name: string;
  };
}

class QuestionBankService extends BaseService {
  async getMyQuestions(token: string): Promise<Question[]> {
    return this.get<Question[]>('/question-banks/', token);
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

  async submitForReview(token: string, questionIds: string[]): Promise<void> {
    await this.post('/question-banks/submit-for-review', { question_ids: questionIds }, token);
  }
  async getQuestionSets(token: string, subjectId: string, gradeLevel: number): Promise<QuestionSet[]> {
    const params = {
      subject_id: subjectId,
      grade_level: gradeLevel.toString()
    };
    const queryString = this.buildQueryParams(params);
    return this.get<QuestionSet[]>(`/question-sets/?${queryString}`, token);
  }

  async updateExamQuestions(token: string, examId: string, questionIds: string[]): Promise<void> {
    await this.put(`/exams/${examId}/questions`, { question_ids: questionIds }, token);
  }
}

export const questionBankService = new QuestionBankService();
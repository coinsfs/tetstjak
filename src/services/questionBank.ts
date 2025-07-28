import { BaseService } from './base';

export interface Question {
  _id: string;
  subject_id: string;
  created_by_teacher_id: string;
  question_type: string;
  difficulty: string;
  question_text: string;
  options: QuestionOption[];
  points: number;
  tags: string[];
  status: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
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
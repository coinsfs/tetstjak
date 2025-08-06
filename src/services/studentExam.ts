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

export interface ExamSession {
  exam_id: string;
  student_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  answers: Record<string, any>;
  question_map: QuestionMap[];
  interaction_logs: any[];
  _id: string;
}

export interface QuestionMap {
  position: number;
  question_id: string;
  shuffled_option_ids: string[] | null;
}

export interface ExamQuestion {
  id: string;
  position: number;
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  options: ExamQuestionOption[];
}

export interface ExamQuestionOption {
  id: string;
  text: string;
}

class StudentExamService extends BaseService {
  async getStudentExams(token: string, filters: StudentExamFilters): Promise<StudentExamResponse> {
    const queryString = this.buildQueryParams(filters);
    const endpoint = `/exams/student?${queryString}`;
    return this.get<StudentExamResponse>(endpoint, token);
  }

  async startExam(token: string, examId: string): Promise<ExamSession> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    if (!examId) {
      throw new Error('Exam ID is required');
    }
    
    try {
      const result = await this.post<ExamSession>(`/exams/${examId}/start`, {}, token);
      
      if (!result || !result._id) {
        throw new Error('Invalid response from server');
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication failed. Please login again.');
        } else if (error.message.includes('403')) {
          throw new Error('You do not have permission to start this exam.');
        } else if (error.message.includes('404')) {
          throw new Error('Exam not found or has been removed.');
        } else if (error.message.includes('409')) {
          throw new Error('You already have an active exam session.');
        } else if (error.message.includes('422')) {
          throw new Error('Exam cannot be started at this time.');
        }
      }
      
      throw error;
    }
  }

  async getExamQuestions(token: string, sessionId: string): Promise<ExamQuestion[]> {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    try {
      const result = await this.get<ExamQuestion[]>(`/exam-sessions/${sessionId}/questions`, token);
      
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format from server');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async submitAnswer(token: string, sessionId: string, questionId: string, answer: any): Promise<void> {
    return this.post(`/exam-sessions/${sessionId}/answers`, {
      question_id: questionId,
      answer: answer
    }, token);
  }

  async submitExam(token: string, sessionId: string): Promise<void> {
    return this.post(`/exam-sessions/${sessionId}/submit`, {}, token);
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
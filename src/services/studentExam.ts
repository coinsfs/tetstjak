import { BaseService } from './base';
import { ExamSessionAnalytics } from '@/types/exam';


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
  has_session?: boolean;
  session_score?: number;
  exam_session_id?: string;
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
  score: number;
  answers: Record<string, any>;
  question_map: any[];
  interaction_logs: any[];
  _id: string;
}

export interface ExamQuestion {
  id: string;
  position: number;
  question_text: string;
  question_type: 'essay' | 'multiple_choice';
  points: number;
  options: ExamQuestionOption[];
}

export interface ExamQuestionOption {
  id: string;
  text: string;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ExamAnalytics {
  exam_id: string;
  exam_title: string;
  subject_name: string;
  exam_type: string;
  exam_date: string;
  class_average: number;
  class_highest: number;
  class_lowest: number;
  student_score: number;
  student_percentile: number;
  total_participants: number;
  score_distribution: ScoreDistribution[];
}

export interface TrendData {
  exam_title: string;
  class_average: number;
  student_score: number;
  exam_date: string;
}

export interface OverallStats {
  total_exams: number;
  class_overall_average: number;
  student_overall_average: number;
  exams_above_class_average: number;
  participation_rate: number;
}

export interface StudentAnalyticsResponse {
  exam_analytics: ExamAnalytics[];
  trend_data: TrendData[];
  overall_stats: OverallStats;
  generated_at: string;
}

export interface TrendScoreStudent {
  exam_date: string;
  score: number;
}

export interface TrendScoreClass {
  exam_date: string;
  average_score: number;
}

export interface StudentStatistics {
  overall_average_student: number;
  best_score_student: number;
  latest_score_student: number;
  participant_rate: number;
  trend_scores_student: TrendScoreStudent[];
  score_distribution_student: ScoreDistribution[];
}

export interface ClassStatistics {
  overall_average_class: number;
  class_highest: number;
  class_lowest: number;
  trend_scores_class: TrendScoreClass[];
  score_distribution_class: ScoreDistribution[];
}

export interface MyStatisticsResponse {
  student_statistics: StudentStatistics;
  class_statistics: ClassStatistics;
}

class StudentExamService extends BaseService {
  async getStudentExams(token: string, filters: StudentExamFilters): Promise<StudentExamResponse> {
    const queryString = this.buildQueryParams(filters);
    const endpoint = `/exams/student?${queryString}`;
    return this.get<StudentExamResponse>(endpoint, token);
  }

  async startExam(token: string, examId: string): Promise<ExamSession> {
    return this.post<ExamSession>(`/exams/${examId}/start`, {}, token);
  }

  async getExamQuestions(token: string, sessionId: string): Promise<ExamQuestion[]> {
    return this.get<ExamQuestion[]>(`/exam-sessions/${sessionId}/questions`, token);
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

  async getStudentAnalytics(token: string): Promise<StudentAnalyticsResponse> {
    return this.get<StudentAnalyticsResponse>('/score-analytics/student/class-exam-analytics', token);
  }

  async getMyStatistics(token: string): Promise<MyStatisticsResponse> {
    return this.get<MyStatisticsResponse>('/score-analytics/student/my-statistics', token);
  }

  async getExamSessionAnalytics(token: string, sessionId: string, forceRegenerate: boolean = false): Promise<ExamSessionAnalytics> {
    const endpoint = `/exam-analytics/session/${sessionId}?force_regenerate=${forceRegenerate}`;
    return this.get<ExamSessionAnalytics>(endpoint, token);
  }
}

export const studentExamService = new StudentExamService();
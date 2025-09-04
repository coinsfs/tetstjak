import { BaseEntity, PaginationParams, PaginationResponse, SearchFilters, AcademicPeriod, ExpertiseProgram } from './common';
import { Teacher } from './user';

export interface Exam extends BaseEntity {
  title: string;
  exam_type: string;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  settings: ExamSettings;
  academic_period_id: string;
  teaching_assignment_id: string;
  proctor_ids: string[];
  questions: string[]; // For backward compatibility
  question_ids?: string[]; // New field for question IDs
  teaching_assignment_details: TeachingAssignmentDetails;
  academic_period_details: AcademicPeriod;
}

export interface ExamSettings {
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_results_after_submission: boolean;
}

export interface TeachingAssignmentDetails {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  _id: string;
  class_details: ExamClassDetails;
  subject_details: ExamSubjectDetails;
  teacher_details: Teacher;
}

export interface ExamClassDetails {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  _id: string;
}

export interface ExamSubjectDetails {
  name: string;
  code: string;
  _id: string;
}

export interface ExamResponse extends PaginationResponse {
  data: Exam[];
}

export interface ExamFilters extends SearchFilters, PaginationParams {
  academic_period_id?: string;
  exam_type?: string;
  grade_level?: string;
}

export interface CreateExamRequest {
  title: string;
  exam_type: string;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  settings: ExamSettings;
  target_criteria: ExamTargetCriteria;
  proctor_ids: string[];
}

export interface UpdateExamRequest {
  title: string;
  exam_type: string;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  proctor_ids: string[];
  settings: ExamSettings;
}

export interface ExamTargetCriteria {
  subject_id: string;
  grade_level?: number;
  expertise_id?: string;
  class_id?: string;
}

export interface Question extends BaseEntity {
  subject_id: string;
  created_by_teacher_id: string;
  question_type: string;
  difficulty: string;
  question_text: string;
  options?: QuestionOption[];
  points: number;
  tags: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

// Exam related data types
export interface ExamClassData {
  grade_level: number;
  expertise_id: string;
  name: string;
  academic_year: string;
  homeroom_teacher_id: string;
  _id: string;
  homeroom_teacher_details?: {
    _id: string;
    full_name: string;
    gender: string;
    profile_picture_url: string | null;
  };
  expertise_details: ExpertiseProgram;
}

export interface ExamSubject extends BaseEntity {
  name: string;
  code: string;
  description: string;
}

export interface TeacherResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Teacher[];
}

// Constants
export const EXAM_TYPES = [
  { value: 'official_uts', label: 'UTS (Ujian Tengah Semester)' },
  { value: 'official_uas', label: 'UAS (Ujian Akhir Semester)' },
  { value: 'quiz', label: 'Kuis' },
  { value: 'daily_test', label: 'Ulangan Harian' }
];

export const EXAM_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_questions', label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ready', label: 'Siap', color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
];

// Detailed Exam Analytics Types
export interface ExamSessionAnalytics {
  exam_session_id: string;
  exam_id: string;
  student_id: string;
  exam_title: string;
  exam_type: string;
  subject_name: string;
  teacher_name: string;
  class_name: string;
  academic_period: string;
  started_at: string;
  submitted_at: string;
  duration_allowed: number;
  duration_taken: number;
  is_overtime: boolean;
  performance_metrics: PerformanceMetrics;
  questions_analytics: QuestionAnalytics[];
  timeline_events: TimelineEvent[];
  score_timeline: ScoreTimelineEvent[];
  violation_analytics: ViolationAnalytics;
  class_comparison: ClassComparison;
  question_difficulty_analysis: QuestionDifficultyAnalysis[];
  answer_pattern_analysis: AnswerPatternAnalysis;
  time_allocation_analysis: TimeAllocationAnalysis;
  behavioral_insights: string[];
  recommendations: string[];
  client_info: Record<string, any>;
  generated_at: string;
  cache_expires_at: string;
}

export interface PerformanceMetrics {
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  accuracy_percentage: number;
  completion_percentage: number;
  total_time_taken: number;
  average_time_per_question: number;
  fastest_answer: number;
  slowest_answer: number;
  score: number;
  max_possible_score: number;
}

export interface QuestionAnalytics {
  question_id: string;
  original_position: number;
  displayed_position: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  points: number;
  student_answer: string;
  correct_answer: string | null;
  student_answer_text: string;
  correct_answer_text: string;
  is_correct: boolean;
  points_earned: number;
  time_spent: number;
  answer_timestamp: string;
  change_count: number;
  options: QuestionOption[];
}

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  question_id: string | null;
  displayed_position: number | null;
  original_position: number | null;
  old_answer: string | null;
  new_answer: string | null;
  is_correct: boolean | null;
  cumulative_score: number;
  details: {
    violation_type?: string;
    severity?: string;
    description?: string;
    answer?: string;
    action?: string;
  };
}

export interface ScoreTimelineEvent {
  timestamp: string;
  cumulative_score: number;
  question_answered: number;
}

export interface ViolationAnalytics {
  total_violations: number;
  violations_by_severity: Record<string, number>;
  violations_by_type: Record<string, number>;
  violation_timeline: ViolationTimelineEvent[];
  fraud_score: number;
  is_flagged: boolean;
  risk_level: string;
}

export interface ViolationTimelineEvent {
  timestamp: string;
  type: string;
  severity: string;
  description: string;
}

export interface ClassComparison {
  class_average_score: number;
  class_highest_score: number;
  class_lowest_score: number;
  student_rank: number;
  total_participants: number;
  percentile: number;
  above_average: boolean;
  score_distribution: ScoreDistributionItem[];
}

export interface ScoreDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface QuestionDifficultyAnalysis {
  difficulty: string;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_time: number;
}

export interface AnswerPatternAnalysis {
  max_correct_streak: number;
  max_wrong_streak: number;
  early_performance: number;
  mid_performance: number;
  late_performance: number;
  performance_trend: string;
  consistency_score: number;
  total_analyzed_questions: number;
}

export interface TimeAllocationAnalysis {
  average_time_per_question: number;
  total_time_accounted: number;
  time_efficiency: number;
  quick_answers_count: number;
  normal_answers_count: number;
  slow_answers_count: number;
  total_interactions: number;
  unique_questions_with_timing: number;
  time_distribution: {
    quick_percentage: number;
    normal_percentage: number;
    slow_percentage: number;
  };
  question_time_breakdown: Record<string, {
    total_time: number;
    average_time: number;
    interaction_count: number;
  }>;
}
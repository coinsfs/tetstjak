export interface TeacherExamAnalytics {
  task_id: string | null;
  status: 'completed' | 'generating' | 'failed';
  exam_metadata: ExamMetadata;
  class_statistics: ClassStatistics;
  questions_analysis: QuestionAnalysis[];
  student_performances: StudentPerformance[];
  time_analysis: TimeAnalysis;
  violation_analysis: ViolationAnalysis;
  comparison_analysis: ComparisonAnalysis;
  generated_at: string;
  generation_time: number;
  cache_expires_at: string;
  data_version: string;
}

export interface ExamMetadata {
  exam_id: string;
  exam_title: string;
  exam_type: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  total_questions: number;
  max_score: number;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  academic_period: string;
}

export interface ClassStatistics {
  total_students: number;
  students_completed: number;
  students_in_progress: number;
  students_not_started: number;
  completion_rate: number;
  class_average: number;
  median_score: number;
  highest_score: number;
  lowest_score: number;
  standard_deviation: number;
  passing_rate: number;
  grade_distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  score_ranges: {
    '0-20': number;
    '21-40': number;
    '41-60': number;
    '61-80': number;
    '81-100': number;
  };
}

export interface QuestionAnalysis {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  points: number;
  class_accuracy: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  average_time: number;
  median_time: number;
  fastest_time: number;
  slowest_time: number;
  is_problematic: boolean;
  discrimination_index: number;
  answer_distribution: any;
  correct_option: string | null;
}

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  exam_session_id: string;
  status: string;
  score: number;
  percentage: number;
  rank: number;
  percentile: number;
  grade: string;
  duration_taken: number;
  time_efficiency: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  accuracy_rate: number;
  violations_count: number;
  integrity_score: number;
  started_at: string;
  submitted_at: string;
}

export interface TimeAnalysis {
  average_completion_time: number;
  median_completion_time: number;
  fastest_completion: number;
  slowest_completion: number;
  standard_deviation: number;
  time_distribution: {
    '0-30min': number;
    '31-60min': number;
    '61-90min': number;
    '90+min': number;
  };
  overtime_count: number;
  early_submission_count: number;
  average_time_per_question: number;
  questions_with_long_response: string[];
}

export interface ViolationAnalysis {
  total_violations: number;
  students_with_violations: number;
  violation_percentage: number;
  violation_types: Record<string, number>;
  severity_distribution: {
    low: number;
    medium?: number;
    high?: number;
    critical?: number;
  };
  flagged_students: string[];
  high_risk_count: number;
  class_integrity_score: number;
  integrity_rating: string;
}

export interface ComparisonAnalysis {
  has_comparison: boolean;
  comparison_exams: any[];
  score_improvement: number | null;
  difficulty_comparison: string | null;
  performance_trend: string | null;
}
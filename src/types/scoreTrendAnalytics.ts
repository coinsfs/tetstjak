export interface ScoreTrendDataPoint {
  date: string;
  score: number;
  exam_id: string;
  exam_title: string;
  subject_name: string;
  subject_code: string;
}

export interface ScoreTrendSeries {
  label: string;
  data: ScoreTrendDataPoint[];
  metadata: {
    class_id?: string;
    grade_level?: number;
    student_count?: number;
    expertise_abbreviation?: string;
    expertise_name?: string;
    subject_id?: string;
    subject_code?: string;
    student_id?: string;
    teacher_id?: string;
  };
}

export interface ScoreTrendResponse {
  series: ScoreTrendSeries[];
  metadata: {
    user_role: string[];
    group_by: string;
    filters_applied?: {
      date_range?: {
        start: string;
        end: string;
      };
      class_id?: string;
      grade_level?: number;
      subject_id?: string;
      expertise_id?: string;
      teacher_id?: string;
      student_id?: string;
      academic_period_id?: string;
    };
    generated_at: string;
  };
}

export interface ScoreTrendFilters {
  start_date?: string;
  end_date?: string;
  class_id?: string;
  grade_level?: number;
  subject_id?: string;
  expertise_id?: string;
  teacher_id?: string;
  student_id?: string;
  academic_period_id?: string;
  group_by?: 'class' | 'subject' | 'grade' | 'teacher' | 'student';
}
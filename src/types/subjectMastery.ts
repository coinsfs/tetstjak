export interface SubjectScore {
  [subjectName: string]: number;
}

export interface EntityMasteryData {
  subject_scores: SubjectScore;
  overall_average: number;
  total_exams: number;
}

export interface SingleEntitySubjectMasteryResponse {
  entity_id: string;
  entity_type: 'student' | 'class' | 'grade' | 'expertise';
  entity_name: string;
  mastery_data: EntityMasteryData;
  metadata: {
    generated_at: string;
    cache_duration: string;
    total_subjects: number;
  };
}

export interface MultipleEntitySubjectMasteryResponse {
  entities: Array<{
    entity_id: string;
    entity_type: 'student' | 'class' | 'grade' | 'expertise';
    entity_name: string;
    mastery_data: EntityMasteryData;
  }>;
  comparison_metadata: {
    total_entities: number;
    school_average: number;
    best_subject: string;
    weakest_subject: string;
    subject_averages: SubjectScore;
  };
}

export type SubjectMasteryResponse = SingleEntitySubjectMasteryResponse | MultipleEntitySubjectMasteryResponse;

export interface SubjectMasteryFilters {
  student_id?: string;
  class_id?: string;
  grade_level?: number;
  expertise_id?: string;
  start_date?: string;
  end_date?: string;
  academic_period_id?: string;
  selectedAcademicPeriod: string;
  min_exams_per_subject?: number;
  include_zero_scores?: boolean;
  use_cache?: boolean;
}
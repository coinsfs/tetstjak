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
  questions: string[];
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
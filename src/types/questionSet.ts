import { BaseEntity, PaginationParams, PaginationResponse, SearchFilters } from './common';

export interface QuestionSetMetadata {
  total_questions: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  total_points: number;
  tags: string[];
}

export interface QuestionSetSubjectDetails {
  name: string;
  code: string;
  description: string | null;
}

export interface QuestionSetCreatedByDetails {
  _id: string;
  full_name: string;
  profile_picture_key: string | null;
}

export interface QuestionSetPermissionHolder {
  _id: string;
  full_name: string;
  profile_picture_key: string | null;
}

export interface QuestionSetCurrentUserPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_manage_questions: boolean;
  can_publish: boolean;
  is_creator: boolean;
}

export interface QuestionSetPermissionHolders {
  can_view: QuestionSetPermissionHolder[];
  can_edit: QuestionSetPermissionHolder[];
  can_manage_questions: QuestionSetPermissionHolder[];
  can_publish: QuestionSetPermissionHolder[];
}

export interface QuestionSet extends BaseEntity {
  name: string;
  description: string;
  grade_level: number;
  status: string;
  is_public: boolean;
  metadata: QuestionSetMetadata;
  subject: QuestionSetSubjectDetails;
  created_by: QuestionSetCreatedByDetails;
  can_edit: boolean;
  can_manage_questions: boolean;
  is_creator: boolean;
  version?: number;
  published_date?: string | null;
  question_ids?: string[];
  permission_holders?: QuestionSetPermissionHolders;
  current_user_permissions?: QuestionSetCurrentUserPermissions;
}

export interface QuestionSetResponse extends PaginationResponse {
  data: QuestionSet[];
}

export interface QuestionSetFilters extends SearchFilters, PaginationParams {
  grade_level?: string;
  subject_id?: string;
  status?: string;
  is_public?: boolean;
}

export interface CreateQuestionSetRequest {
  name: string;
  subject_id: string;
  grade_level: number;
  description: string;
  is_public: boolean;
  tags: string[];
}

export interface UpdateQuestionSetRequest {
  name?: string;
  subject_id?: string;
  grade_level?: number;
  description?: string;
  is_public?: boolean;
  tags?: string[];
  question_ids?: string[];
}

export interface CoordinationAssignment {
  coordination_assignment_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  subject_description: string | null;
  grade_level: number;
  academic_period_id: string;
  coordination_title: string;
}
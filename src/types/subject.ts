import { BaseEntity, PaginationParams, PaginationResponse, SearchFilters } from './common';

export interface Subject extends BaseEntity {
  name: string;
  code: string;
  description: string;
}

export interface SubjectResponse extends PaginationResponse {
  data: Subject[];
}

export interface SubjectFilters extends SearchFilters, PaginationParams {}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description: string;
}

export interface UpdateSubjectRequest {
  name: string;
  code: string;
  description: string;
}

// Subject Coordinator types
export interface SubjectCoordinator {
  _id?: string;
  subject_id: string;
  grade_level: number;
  coordinator_teacher_id: string;
  created_at?: string;
  updated_at?: string;
  subject_details?: Subject;
  coordinator_details?: {
    _id: string;
    full_name: string;
    profile_picture_url: string | null;
  };
}

export interface CoordinatorMatrix {
  [gradeLevel: string]: {
    [subjectId: string]: {
      coordinator?: SubjectCoordinator;
      selectedTeacherId?: string;
      isDirty: boolean;
      originalCoordinatorId?: string;
    };
  };
}

export interface CoordinatorAction {
  type: 'create' | 'update' | 'delete';
  coordinator_id?: string;
  data?: {
    subject_id: string;
    grade_level: number;
    coordinator_teacher_id: string;
  };
}

export interface CoordinatorBatchRequest {
  actions: CoordinatorAction[];
}

export interface CoordinatorBatchResponse {
  task_id: string;
  status: string;
  result: string;
}

export interface TeachingAssignmentForCoordinator {
  _id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  class_details: {
    grade_level: number;
    name: string;
    expertise_details?: {
      abbreviation: string;
    };
  };
  subject_details: {
    _id: string;
    name: string;
    code: string;
  };
  teacher_details: {
    _id: string;
    full_name: string;
    profile_picture_url: string | null;
  };
}
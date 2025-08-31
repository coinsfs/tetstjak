export interface TeachingAssignment {
  _id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  class_details?: {
    grade_level: number;
    expertise_id: string;
    name: string;
    academic_year: string;
    _id: string;
    expertise_details?: {
      name: string;
      abbreviation: string;
    };
  };
  subject_details?: {
    name: string;
    code: string;
    _id: string;
  };
  teacher_details?: {
    _id: string;
    full_name: string;
    gender: string;
    profile_picture_url: string | null;
  };
}

export interface AssignmentAction {
  type: 'create' | 'update' | 'delete';
  assignment_id?: string;
  data?: {
    class_id: string;
    subject_id: string;
    teacher_id: string;
  };
}

export interface AssignmentBatchRequest {
  actions: AssignmentAction[];
}

export interface AssignmentBatchResponse {
  task_id: string;
  status: string;
  result: string;
}

export interface AssignmentMatrix {
  [classId: string]: {
    [subjectId: string]: {
      assignment?: TeachingAssignment;
      selectedTeacherId?: string;
      isDirty: boolean;
      originalAssignmentId?: string;
    };
  };
}

export interface AssignmentDraft {
  matrix: AssignmentMatrix;
  timestamp: number;
}

export interface BulkUpdateProgress {
  type: 'bulk_update_progress';
  task_id: string;
  processed: number;
  total: number;
  success: number;
  failed: number;
  errors?: string[];
}

export interface BulkUpdateComplete {
  type: 'bulk_update_complete';
  task_id: string;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  details: {
    total: number;
    success: number;
    failed: number;
    errors?: string[];
  };
}

export interface TaskStatus {
  task_id: string;
  status: string;
  result: string;
  details?: {
    created?: number;
    updated?: number;
    deleted?: number;
    failed?: number;
    total?: number;
    success?: number;
    errors?: string[];
  };
  academic_period_id?: string;
}
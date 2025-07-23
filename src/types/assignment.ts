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
  result: any;
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
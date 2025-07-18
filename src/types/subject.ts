export interface Subject {
  name: string;
  code: string;
  description: string;
  _id: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: Subject[];
}

export interface SubjectFilters {
  search?: string;
  page?: number;
  limit?: number;
}

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
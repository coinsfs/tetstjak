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
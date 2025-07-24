import { BaseEntity, PaginationParams, PaginationResponse, SearchFilters } from './common';
import { Teacher } from './user';

export interface ExpertiseProgram extends BaseEntity {
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
  head_of_department_details?: Teacher;
}

export interface ExpertiseProgramResponse extends PaginationResponse {
  data: ExpertiseProgram[];
}

export interface ExpertiseProgramFilters extends SearchFilters, PaginationParams {}

export interface CreateExpertiseProgramRequest {
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
}

export interface UpdateExpertiseProgramRequest {
  name: string;
  abbreviation: string;
  description: string;
  head_of_department_id: string;
}
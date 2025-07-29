import { Subject, SubjectResponse, SubjectFilters, CreateSubjectRequest, UpdateSubjectRequest } from '@/types/subject';
import { 
  SubjectCoordinator, 
  CoordinatorBatchRequest, 
  CoordinatorBatchResponse,
  TeachingAssignmentForCoordinator 
} from '@/types/subject';
import { BaseService } from './base';

class SubjectService extends BaseService {
  async getSubjects(token: string, filters?: SubjectFilters): Promise<SubjectResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/subjects/?${queryString}` : '/subjects/';
    return this.get<SubjectResponse>(endpoint, token);
  }

  async createSubject(token: string, data: CreateSubjectRequest): Promise<Subject> {
    return this.post<Subject>('/subjects/', data, token);
  }

  async updateSubject(token: string, subjectId: string, data: UpdateSubjectRequest): Promise<Subject> {
    return this.put<Subject>(`/subjects/${subjectId}`, data, token);
  }

  async deleteSubject(token: string, subjectId: string): Promise<void> {
    await this.delete(`/subjects/${subjectId}`, token);
  }

  // Subject Coordinator methods
  async getSubjectCoordinators(token: string): Promise<SubjectCoordinator[]> {
    const response = await this.get<{ data: SubjectCoordinator[] }>('/subject-coordinators/?limit=1000', token);
    return response.data || [];
  }

  async batchUpdateCoordinators(token: string, request: CoordinatorBatchRequest): Promise<CoordinatorBatchResponse> {
    return this.post<CoordinatorBatchResponse>('/subject-coordinators/bulk-update', request, token);
  }

  async getTeachingAssignmentsForCoordinator(token: string): Promise<TeachingAssignmentForCoordinator[]> {
    const response = await this.get<{ data: TeachingAssignmentForCoordinator[] }>('/teaching-assignments/?limit=1000', token);
    return response.data || [];
  }
}

export const subjectService = new SubjectService();
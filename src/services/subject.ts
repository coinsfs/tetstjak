import { Subject, SubjectResponse, SubjectFilters, CreateSubjectRequest, UpdateSubjectRequest } from '@/types/subject';
import { 
  SubjectCoordinator, 
  CoordinatorBatchRequest,
  CoordinatorBatchResponse,
  TeachingAssignmentForCoordinator,
  AvailableCoordinator
} from '@/types/subject';
import { Teacher } from '@/types/user';
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
    return this.get<SubjectCoordinator[]>('/coordination-assignments/', token);
  }

  async batchUpdateCoordinators(token: string, request: CoordinatorBatchRequest): Promise<CoordinatorBatchResponse> {
    return this.post<CoordinatorBatchResponse>('/coordination-assignments/bulk', request, token);
  }

  async getTeachingAssignmentsForCoordinator(token: string): Promise<TeachingAssignmentForCoordinator[]> {
    const response = await this.get<{ data: TeachingAssignmentForCoordinator[] }>('/teaching-assignments/?limit=1000', token);
    return response.data || [];
  }

  async getTeachers(token: string): Promise<Teacher[]> {
    const response = await this.get<{ data: Teacher[] }>('/users/?role=teacher&limit=1000', token);
    return response.data || [];
  }

  async getActiveAcademicPeriod(token: string): Promise<{ _id: string } | null> {
    try {
      return await this.get<{ _id: string }>('/academic-periods/active', token);
    } catch (error) {
      console.error('No active academic period found:', error);
      return null;
    }
  }

  async getAvailableCoordinators(token: string): Promise<AvailableCoordinator[]> {
    return this.get<AvailableCoordinator[]>('/coordination-assignments/available-coordinators', token);
  }
}

export const subjectService = new SubjectService();
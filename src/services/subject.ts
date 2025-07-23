import { Subject, SubjectResponse, SubjectFilters, CreateSubjectRequest, UpdateSubjectRequest } from '@/types/subject';
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
}

export const subjectService = new SubjectService();
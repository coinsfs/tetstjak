import { BaseService } from './base';
import { SubjectMasteryResponse, SubjectMasteryFilters } from '@/types/subjectMastery';

class SubjectMasteryAnalyticsService extends BaseService {
  async getSubjectMasteryAnalytics(token: string, filters: SubjectMasteryFilters = {}): Promise<SubjectMasteryResponse> {
    // For GET requests, we need to build query parameters
    if (Object.keys(filters).length > 0) {
      const queryString = this.buildQueryParams(filters);
      return this.get<SubjectMasteryResponse>(`/analytics/subject-mastery?${queryString}`, token);
    }
    return this.get<SubjectMasteryResponse>('/analytics/subject-mastery', token);
  }

  async postSubjectMasteryAnalytics(token: string, filters: SubjectMasteryFilters): Promise<SubjectMasteryResponse> {
    return this.post<SubjectMasteryResponse>('/analytics/subject-mastery', filters, token);
  }

  async clearCache(token: string): Promise<void> {
    return this.delete('/analytics/subject-mastery/cache', token);
  }
}

export const subjectMasteryAnalyticsService = new SubjectMasteryAnalyticsService();
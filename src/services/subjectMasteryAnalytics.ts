import { BaseService } from './base';
import { SubjectMasteryResponse, SubjectMasteryFilters } from '@/types/subjectMastery';

class SubjectMasteryAnalyticsService extends BaseService {
  async getSubjectMasteryAnalytics(token: string, filters: SubjectMasteryFilters = {}): Promise<SubjectMasteryResponse> {
    // Always include default parameters
    const defaultParams = {
      include_zero_scores: false,
      min_exams_per_subject: 1,
      use_cache: true,
      ...filters
    };
    
    const queryString = this.buildQueryParams(defaultParams);
    return this.get<SubjectMasteryResponse>(`/exam-analytics/subject-mastery?${queryString}`, token);
  }

  async postSubjectMasteryAnalytics(token: string, filters: SubjectMasteryFilters): Promise<SubjectMasteryResponse> {
    return this.post<SubjectMasteryResponse>('/analytics/subject-mastery', filters, token);
  }

  async clearCache(token: string): Promise<void> {
    return this.delete('/analytics/subject-mastery/cache', token);
  }
}

export const subjectMasteryAnalyticsService = new SubjectMasteryAnalyticsService();
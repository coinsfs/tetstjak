import { BaseService } from './base';
import { ScoreTrendResponse, ScoreTrendFilters } from '@/types/scoreTrendAnalytics';

class ScoreTrendAnalyticsService extends BaseService {
  async getScoreTrendAnalytics(token: string, filters: ScoreTrendFilters = {}): Promise<ScoreTrendResponse> {
    // For GET requests, we need to build query parameters
    if (Object.keys(filters).length > 0) {
      const queryString = this.buildQueryParams(filters);
      return this.get<ScoreTrendResponse>(`/exam-analytics/score-trend?${queryString}`, token);
    }
    return this.get<ScoreTrendResponse>('/exam-analytics/score-trend', token);
  }

  async postScoreTrendAnalytics(token: string, filters: ScoreTrendFilters): Promise<ScoreTrendResponse> {
    return this.post<ScoreTrendResponse>('/exam-analytics/score-trend', filters, token);
  }
}

export const scoreTrendAnalyticsService = new ScoreTrendAnalyticsService();
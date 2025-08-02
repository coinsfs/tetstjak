import { BaseService } from './base';
import { 
  QuestionSet, 
  QuestionSetResponse, 
  QuestionSetFilters, 
  CreateQuestionSetRequest, 
  UpdateQuestionSetRequest,
  CoordinationAssignment
} from '@/types/questionSet';

class QuestionSetService extends BaseService {
  async getQuestionSets(token: string, filters?: QuestionSetFilters): Promise<QuestionSetResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/question-sets/?${queryString}` : '/question-sets/';
    return this.get<QuestionSetResponse>(endpoint, token);
  }

  async createQuestionSet(token: string, data: CreateQuestionSetRequest): Promise<QuestionSet> {
    return this.post<QuestionSet>('/question-sets/', data, token);
  }

  async getQuestionSetDetails(token: string, questionSetId: string): Promise<QuestionSet> {
    return this.get<QuestionSet>(`/question-sets/${questionSetId}`, token);
  }

  async updateQuestionSet(token: string, questionSetId: string, data: UpdateQuestionSetRequest): Promise<QuestionSet> {
    return this.put<QuestionSet>(`/question-sets/${questionSetId}`, data, token);
  }

  async searchQuestionSets(token: string, query: string, filters?: QuestionSetFilters): Promise<QuestionSetResponse> {
    const params = {
      search: query,
      ...filters
    };
    const queryString = this.buildQueryParams(params);
    return this.get<QuestionSetResponse>(`/question-sets/users/search?${queryString}`, token);
  }

  async getMyCoordinations(token: string): Promise<CoordinationAssignment[]> {
    return this.get<CoordinationAssignment[]>('/coordination-assignments/my-coordinations', token);
  }

  async deleteQuestionSet(token: string, questionSetId: string): Promise<void> {
    await this.delete(`/question-sets/${questionSetId}`, token);
  }
}

export const questionSetService = new QuestionSetService();
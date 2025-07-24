import { 
  ExpertiseProgram, 
  ExpertiseProgramResponse, 
  ExpertiseProgramFilters, 
  CreateExpertiseProgramRequest, 
  UpdateExpertiseProgramRequest 
} from '@/types/expertise';
import { BaseService } from './base';

class ExpertiseProgramService extends BaseService {
  async getExpertisePrograms(token: string, filters?: ExpertiseProgramFilters): Promise<ExpertiseProgramResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/expertise-programs/?${queryString}` : '/expertise-programs/';
    return this.get<ExpertiseProgramResponse>(endpoint, token);
  }

  async getExpertiseProgramById(token: string, id: string): Promise<ExpertiseProgram> {
    return this.get<ExpertiseProgram>(`/expertise-programs/${id}`, token);
  }

  async createExpertiseProgram(token: string, data: CreateExpertiseProgramRequest): Promise<ExpertiseProgram> {
    return this.post<ExpertiseProgram>('/expertise-programs/', data, token);
  }

  async updateExpertiseProgram(token: string, id: string, data: UpdateExpertiseProgramRequest): Promise<ExpertiseProgram> {
    return this.put<ExpertiseProgram>(`/expertise-programs/${id}`, data, token);
  }

  async deleteExpertiseProgram(token: string, id: string): Promise<void> {
    await this.delete(`/expertise-programs/${id}`, token);
  }
}

export const expertiseProgramService = new ExpertiseProgramService();
import { 
  ExpertiseProgram, 
  ExpertiseProgramResponse, 
  ExpertiseProgramFilters, 
  CreateExpertiseProgramRequest, 
  UpdateExpertiseProgramRequest 
} from '@/types/expertise';
import { Teacher } from '@/types/user';
import { BaseService } from './base';

class ExpertiseProgramService extends BaseService {
  async getExpertisePrograms(token: string, filters?: ExpertiseProgramFilters): Promise<ExpertiseProgramResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/expertise-programs/?${queryString}` : '/expertise-programs/';
    return this.get<ExpertiseProgramResponse>(endpoint, token);
  }

  async createExpertiseProgram(token: string, data: CreateExpertiseProgramRequest): Promise<ExpertiseProgram> {
    return this.post<ExpertiseProgram>('/expertise-programs/', data, token);
  }

  async updateExpertiseProgram(token: string, expertiseId: string, data: UpdateExpertiseProgramRequest): Promise<ExpertiseProgram> {
    return this.put<ExpertiseProgram>(`/expertise-programs/${expertiseId}`, data, token);
  }

  async deleteExpertiseProgram(token: string, expertiseId: string): Promise<void> {
    await this.delete(`/expertise-programs/${expertiseId}`, token);
  }

  async getTeachers(token: string): Promise<Teacher[]> {
    const response = await this.get<{ data: Teacher[] }>('/users/?role=teacher&limit=1000', token);
    return response.data || [];
  }
}

export const expertiseProgramService = new ExpertiseProgramService();
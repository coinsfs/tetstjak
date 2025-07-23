import { 
  Class, 
  ClassResponse,
  ClassFilters, 
  CreateClassRequest, 
  UpdateClassRequest, 
  ClassStudent,
  TeacherResponse
} from '@/types/class';
import { ExpertiseProgram } from '@/types/common';
import { BaseService } from './base';

class ClassService extends BaseService {
  async getClasses(token: string, filters?: ClassFilters): Promise<ClassResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/classes/?${queryString}` : '/classes/';
    
    const result = await this.get<any>(endpoint, token);
    
    // Ensure the response has the expected structure
    return {
      total_items: result.total_items || 0,
      total_pages: result.total_pages || 0,
      current_page: result.current_page || 1,
      limit: result.limit || 10,
      data: result.data || [],
      grade_10_total: result.grade_10_total || 0,
      grade_11_total: result.grade_11_total || 0,
      grade_12_total: result.grade_12_total || 0
    };
  }

  async createClass(token: string, data: CreateClassRequest): Promise<Class> {
    return this.post<Class>('/classes/', data, token);
  }

  async updateClass(token: string, classId: string, data: UpdateClassRequest): Promise<Class> {
    return this.put<Class>(`/classes/${classId}`, data, token);
  }

  async deleteClass(token: string, classId: string): Promise<void> {
    await this.delete(`/classes/${classId}`, token);
  }

  async getExpertisePrograms(token: string): Promise<ExpertiseProgram[]> {
    const result = await this.get<{ data: ExpertiseProgram[] }>('/expertise-programs/', token);
    return result.data || [];
  }

  async getTeachers(token: string): Promise<TeacherResponse> {
    return this.get<TeacherResponse>('/users/?role=teacher', token);
  }

  async getClassStudents(token: string, classId: string): Promise<ClassStudent[]> {
    const params = {
      role: 'student',
      class_id: classId
    };
    
    const queryString = this.buildQueryParams(params);
    const result = await this.get<{ data: ClassStudent[] }>(`/users/?${queryString}`, token);
    return result.data || [];
  }
}

export const classService = new ClassService();
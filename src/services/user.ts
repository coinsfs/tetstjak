import { 
  Teacher, 
  Student, 
  BasicTeacher,
  TeacherResponse, 
  StudentResponse, 
  TeacherFilters, 
  StudentFilters, 
  CreateTeacherRequest, 
  UpdateTeacherRequest, 
  CreateStudentRequest, 
  UpdateStudentRequest,
  ClassDetails
} from '@/types/user';
import { ExpertiseProgram } from '@/types/common';
import { BaseService } from './base';

class UserService extends BaseService {
  // Teacher methods
  async getTeachers(
    token: string, 
    filters?: TeacherFilters & { page?: number; limit?: number }
  ): Promise<TeacherResponse> {
    const params = {
      role: 'teacher',
      ...filters
    };

    const queryString = this.buildQueryParams(params);
    return this.get<TeacherResponse>(`/users/?${queryString}`, token);
  }

  // Optimized method for getting basic teacher info (for assignments)
  async getBasicTeachers(
    token: string, 
    searchTerm?: string
  ): Promise<BasicTeacher[]> {
    const params: Record<string, any> = {};
    
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    const queryString = this.buildQueryParams(params);
    const endpoint = queryString ? `/users/teachers/basic?${queryString}` : '/users/teachers/basic';
    
    return this.get<BasicTeacher[]>(endpoint, token);
  }

  async getTeacherById(token: string, id: string): Promise<Teacher> {
    return this.get<Teacher>(`/users/${id}`, token);
  }

  async createTeacher(token: string, data: CreateTeacherRequest): Promise<Teacher> {
    return this.post<Teacher>('/users/', data, token);
  }

  async updateTeacher(token: string, teacherId: string, data: UpdateTeacherRequest): Promise<Teacher> {
    return this.put<Teacher>(`/users/${teacherId}`, data, token);
  }

  async deleteTeacher(token: string, teacherId: string): Promise<void> {
    await this.delete(`/users/${teacherId}`, token);
  }

  async toggleTeacherStatus(token: string, teacherId: string, isActive: boolean): Promise<Teacher> {
    return this.updateTeacher(token, teacherId, { is_active: isActive });
  }

  // Student methods
  async getStudents(
    token: string, 
    filters?: StudentFilters & { page?: number; limit?: number }
  ): Promise<StudentResponse> {
    const params = {
      role: 'student',
      ...filters
    };

    const queryString = this.buildQueryParams(params);
    return this.get<StudentResponse>(`/users/?${queryString}`, token);
  }

  async getStudentById(token: string, id: string): Promise<Student> {
    return this.get<Student>(`/users/${id}`, token);
  }

  async createStudent(token: string, data: CreateStudentRequest): Promise<Student> {
    return this.post<Student>('/users/', data, token);
  }

  async updateStudent(token: string, studentId: string, data: UpdateStudentRequest): Promise<Student> {
    return this.put<Student>(`/users/${studentId}`, data, token);
  }

  async deleteStudent(token: string, studentId: string): Promise<void> {
    await this.delete(`/users/${studentId}`, token);
  }

  async toggleStudentStatus(token: string, studentId: string, isActive: boolean): Promise<Student> {
    const endpoint = isActive ? 'reactivate' : 'deactivate';
    return this.put<Student>(`/users/${studentId}/${endpoint}`, {}, token);
  }

  // Change password method
  async changePassword(token: string, data: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }): Promise<void> {
    await this.post('/users/me/change-password', data, token);
  }

  // Common methods for both teachers and students
  async getExpertisePrograms(token: string): Promise<ExpertiseProgram[]> {
    const result = await this.get<{ data: ExpertiseProgram[] }>('/expertise-programs/', token);
    return result.data || [];
  }

  async getClasses(token: string): Promise<ClassDetails[]> {
    const params = { limit: '100' };
    const queryString = this.buildQueryParams(params);
    const response = await this.get<{ data: ClassDetails[] }>(`/classes/?${queryString}`, token);
    return response.data || [];
  }

  async getDepartments(token: string): Promise<ExpertiseProgram[]> {
    const result = await this.get<{ data: ExpertiseProgram[] }>('/expertise-programs/', token);
    return result.data || [];
  }
}

export const userService = new UserService();

// Legacy exports for backward compatibility
export const teacherService = userService;
export const studentService = userService;
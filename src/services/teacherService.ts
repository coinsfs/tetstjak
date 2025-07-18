import { Teacher, TeacherResponse, TeacherFilters, CreateTeacherRequest, UpdateTeacherRequest, ClassData, DepartmentData } from '../types/teacher';

const API_BASE_URL = 'http://192.168.250.9:8000/api/v1';

class TeacherService {
  async getTeachers(token: string, start: number = 0, length: number = 10, filters?: TeacherFilters): Promise<TeacherResponse> {
    const url = new URL(`${API_BASE_URL}/users/`);
    url.searchParams.append('role', 'teacher');
    url.searchParams.append('start', start.toString());
    url.searchParams.append('length', length.toString());
    
    if (filters?.search) {
      url.searchParams.append('search', filters.search);
    }
    
    if (filters?.expertise_id && filters.expertise_id !== 'all') {
      url.searchParams.append('expertise_id', filters.expertise_id);
    }
    
    if (filters?.class_id && filters.class_id !== 'all') {
      url.searchParams.append('class_id', filters.class_id);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch teachers');
    }

    return response.json();
  }

  async getTeacherById(token: string, id: string): Promise<Teacher> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch teacher');
    }
  
    return response.json();
  }
  

  async createTeacher(token: string, data: CreateTeacherRequest): Promise<Teacher> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create teacher');
    }

    return response.json();
  }

  async updateTeacher(token: string, teacherId: string, data: UpdateTeacherRequest): Promise<Teacher> {
    const response = await fetch(`${API_BASE_URL}/users/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update teacher');
    }

    return response.json();
  }

  async deleteTeacher(token: string, teacherId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${teacherId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete teacher');
    }
  }

  async toggleTeacherStatus(token: string, teacherId: string, isActive: boolean): Promise<Teacher> {
    return this.updateTeacher(token, teacherId, { is_active: isActive });
  }

  async getClasses(token: string): Promise<ClassData[]> {
    const response = await fetch(`${API_BASE_URL}/classes/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }

    return response.json();
  }

  async getDepartments(token: string): Promise<DepartmentData[]> {
    const response = await fetch(`${API_BASE_URL}/expertise-programs/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    return response.json();
  }
}

export const teacherService = new TeacherService();
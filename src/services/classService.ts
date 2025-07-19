import { 
  Class, 
  ClassFilters, 
  CreateClassRequest, 
  UpdateClassRequest, 
  ExpertiseProgram, 
  TeacherResponse,
  ClassStudent 
} from '../types/class';

const API_BASE_URL = 'http://192.168.250.9:8000/api/v1';

class ClassService {
  async getClasses(token: string, filters?: ClassFilters): Promise<Class[]> {
    const url = new URL(`${API_BASE_URL}/classes/`);
    
    if (filters?.search) {
      url.searchParams.append('search', filters.search);
    }
    
    if (filters?.grade_level && filters.grade_level !== 'all') {
      url.searchParams.append('grade_level', filters.grade_level);
    }
    
    if (filters?.expertise_id && filters.expertise_id !== 'all') {
      url.searchParams.append('expertise_id', filters.expertise_id);
    }
    
    if (filters?.academic_year && filters.academic_year !== 'all') {
      url.searchParams.append('academic_year', filters.academic_year);
    }

    const response = await fetch(url.toString(), {
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

  async createClass(token: string, data: CreateClassRequest): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/classes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create class');
    }

    return response.json();
  }

  async updateClass(token: string, classId: string, data: UpdateClassRequest): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update class');
    }

    return response.json();
  }

  async deleteClass(token: string, classId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete class');
    }
  }

  async getExpertisePrograms(token: string): Promise<ExpertiseProgram[]> {
    const response = await fetch(`${API_BASE_URL}/expertise-programs/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expertise programs');
    }

    return response.json();
  }

  async getTeachers(token: string): Promise<TeacherResponse> {
    const response = await fetch(`${API_BASE_URL}/users/?role=teacher`, {
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

  async getClassStudents(token: string, classId: string): Promise<ClassStudent[]> {
    const url = new URL(`${API_BASE_URL}/users/`);
    url.searchParams.append('role', 'student');
    url.searchParams.append('class_id', classId);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch class students');
    }

    const result = await response.json();
    return result.data || [];
  }
}

export const classService = new ClassService();
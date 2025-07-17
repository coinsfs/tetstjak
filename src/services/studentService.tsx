import { Student, StudentResponse, StudentFilters, CreateStudentRequest, UpdateStudentRequest, ExpertiseProgram, ClassData } from '../types/student';

const API_BASE_URL = 'http://192.168.250.9:8000/api/v1';

class StudentService {
  async getStudents(token: string, start: number = 0, length: number = 10, filters?: StudentFilters): Promise<StudentResponse> {
    const url = new URL(`${API_BASE_URL}/users/`);
    url.searchParams.append('role', 'student');
    url.searchParams.append('start', start.toString());
    url.searchParams.append('length', length.toString());
    
    if (filters?.search) {
      url.searchParams.append('search', filters.search);
    }
    
    if (filters?.grade_level && filters.grade_level !== 'all') {
      url.searchParams.append('grade_level', filters.grade_level);
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
      throw new Error('Failed to fetch students');
    }

    return response.json();
  }

  async getStudentById(token: string, id: string): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student');
    }

    return response.json();
  }

  async createStudent(token: string, data: CreateStudentRequest): Promise<Student> {
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
      throw new Error(error.detail || 'Failed to create student');
    }

    return response.json();
  }

  async updateStudent(token: string, studentId: string, data: UpdateStudentRequest): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update student');
    }

    return response.json();
  }

  async deleteStudent(token: string, studentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete student');
    }
  }

  async toggleStudentStatus(token: string, studentId: string, isActive: boolean): Promise<Student> {
    const endpoint = isActive ? 'reactivate' : 'deactivate';
    const response = await fetch(`${API_BASE_URL}/users/${studentId}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Failed to ${endpoint} student`);
    }

    return response.json();
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
}

export const studentService = new StudentService();
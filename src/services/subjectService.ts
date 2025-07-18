import { Subject, SubjectResponse, SubjectFilters, CreateSubjectRequest, UpdateSubjectRequest } from '../types/subject';

const API_BASE_URL = 'http://192.168.250.9:8000/api/v1';

class SubjectService {
  async getSubjects(token: string, filters?: SubjectFilters): Promise<SubjectResponse> {
    const url = new URL(`${API_BASE_URL}/subjects/`);
    
    if (filters?.search) {
      url.searchParams.append('search', filters.search);
    }
    
    if (filters?.page) {
      url.searchParams.append('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      url.searchParams.append('limit', filters.limit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }

    return response.json();
  }

  async createSubject(token: string, data: CreateSubjectRequest): Promise<Subject> {
    const response = await fetch(`${API_BASE_URL}/subjects/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create subject');
    }

    return response.json();
  }

  async updateSubject(token: string, subjectId: string, data: UpdateSubjectRequest): Promise<Subject> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update subject');
    }

    return response.json();
  }

  async deleteSubject(token: string, subjectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete subject');
    }
  }
}

export const subjectService = new SubjectService();
import { BaseService } from './base';

export interface ImportTaskResponse {
  task_id: string;
  status: string;
  result: any;
}

export interface ImportTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  result: {
    status: string;
    success_count: number;
    failed_count: number;
    errors: string[];
  } | null;
}

class ImportService extends BaseService {
  async downloadTemplate(token: string, type: 'users' | 'teachers' | 'students'): Promise<Blob> {
    const endpoint = `/jobs/${type}/import-template`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return response.blob();
  }

  async uploadFile(token: string, file: File, type: 'users' | 'teachers' | 'students'): Promise<ImportTaskResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `/jobs/${type}/import`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Failed to upload file');
    }

    return response.json();
  }

  async getTaskStatus(token: string, taskId: string): Promise<ImportTaskStatus> {
    return this.get<ImportTaskStatus>(`/jobs/tasks/${taskId}`, token);
  }
}

export const importService = new ImportService();
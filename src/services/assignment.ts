import { TeachingAssignment, AssignmentBatchRequest, AssignmentBatchResponse } from '@/types/assignment';
import { BaseService } from './base';

class AssignmentService extends BaseService {
  async getTeachingAssignments(token: string): Promise<TeachingAssignment[]> {
    const response = await this.get<{ data: TeachingAssignment[] }>('/teaching-assignments/', token);
    return response.data || [];
  }

  async batchUpdateAssignments(token: string, request: AssignmentBatchRequest): Promise<AssignmentBatchResponse> {
    return this.post<AssignmentBatchResponse>('/teaching-assignments/batch', request, token);
  }

  async getTaskStatus(token: string, taskId: string): Promise<any> {
    return this.get<any>(`/tasks/${taskId}`, token);
  }
}

export const assignmentService = new AssignmentService();
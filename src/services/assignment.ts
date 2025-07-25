import { TeachingAssignment, AssignmentBatchRequest, AssignmentBatchResponse } from '@/types/assignment';
import { TaskStatus } from '@/types/assignment';
import { BaseService } from './base';

class AssignmentService extends BaseService {
  async getTeachingAssignments(token: string): Promise<TeachingAssignment[]> {
    const response = await this.get<{ data: TeachingAssignment[] }>('/teaching-assignments/?limit=1000', token);
    return response.data || [];
  }

  async batchUpdateAssignments(token: string, request: AssignmentBatchRequest): Promise<AssignmentBatchResponse> {
    return this.post<AssignmentBatchResponse>('/teaching-assignments/bulk-update', request, token);
  }

  async getTaskStatus(token: string, taskId: string): Promise<TaskStatus> {
    return this.get<TaskStatus>(`/jobs/tasks/${taskId}`, token);
  }
}

export const assignmentService = new AssignmentService();
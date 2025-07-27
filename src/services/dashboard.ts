import { 
  DashboardStats, 
  StudentCountByMajor, 
  StudentGrowth, 
  BrowserUsage, 
  ActivityLog 
} from '@/types/dashboard';
import { StudentPerformance } from '@/components/StudentPerformanceTable';
import { BaseService } from './base';

export interface TeacherDashboardStats {
  total_classes: number;
  total_students: number;
  total_exams: number;
  total_questions: number;
}
class DashboardService extends BaseService {
  async getDashboardStats(token: string): Promise<DashboardStats> {
    return this.get<DashboardStats>('/analytics/dashboard-stats', token);
  }

  async getTeacherDashboardStats(token: string): Promise<TeacherDashboardStats> {
    return this.get<TeacherDashboardStats>('/analytics/teacher/dashboard-stats', token);
  }
  async getStudentCountByMajor(token: string): Promise<StudentCountByMajor[]> {
    return this.get<StudentCountByMajor[]>('/analytics/student-count-by-major', token);
  }

  async getStudentGrowth(token: string, years?: number): Promise<StudentGrowth[]> {
    const endpoint = years 
      ? `/analytics/student-growth?years=${years}`
      : '/analytics/student-growth';
    
    return this.get<StudentGrowth[]>(endpoint, token);
  }

  async getBrowserUsage(token: string): Promise<BrowserUsage[]> {
    return this.get<BrowserUsage[]>('/analytics/browser-usage', token);
  }

  async getActivityLogs(token: string, limit: number = 5): Promise<ActivityLog[]> {
    return this.get<ActivityLog[]>(`/activity-logs/?limit=${limit}`, token);
  }

  async getStudentPerformanceRoster(token: string, limit: number = 5): Promise<StudentPerformance[]> {
    return this.get<StudentPerformance[]>(`/analytics/student-performance-roster?limit=${limit}`, token);
  }
}

export const dashboardService = new DashboardService();
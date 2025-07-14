const API_BASE_URL = 'http://192.168.43.9:8000/api/v1';

class DashboardService {
  async getDashboardStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
  }

  async getStudentCountByMajor(token: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/student-count-by-major`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student count by major');
    }

    return response.json();
  }

  async getStudentGrowth(token: string, years?: number) {
    const url = years 
      ? `${API_BASE_URL}/analytics/student-growth?years=${years}`
      : `${API_BASE_URL}/analytics/student-growth`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student growth');
    }

    return response.json();
  }

  async getBrowserUsage(token: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/browser-usage`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch browser usage');
    }

    return response.json();
  }

  async getActivityLogs(token: string, limit: number = 5) {
    const response = await fetch(`${API_BASE_URL}/activity-logs/?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }

    return response.json();
  }
}

export const dashboardService = new DashboardService();
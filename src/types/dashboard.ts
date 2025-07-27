export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_subjects: number;
}

export interface TeacherDashboardStats {
  total_classes: number;
  total_students: number;
  total_exams: number;
  total_questions: number;
}
export interface StudentCountByMajor {
  major_name: string;
  major_abbreviation: string;
  grade_10_count: number;
  grade_11_count: number;
  grade_12_count: number;
}

export interface StudentGrowth {
  year: number;
  student_count: number;
}

export interface BrowserUsage {
  browser_name: string;
  count: number;
  percentage: number;
}

export interface ActivityLog {
  user_data: {
    user_id: string;
    full_name: string;
    user_roles: string[];
  };
  activity: string;
  description: string;
  ip_address: string;
  device_info: {
    device_type: string;
    os_name: string;
    os_version: string;
    browser_name: string;
    browser_version: string;
    user_agent: string;
  };
  status: string;
  details: {
    method: string;
    endpoint: string;
  };
  created_at: string;
  _id: string;
}

export interface WebSocketMessage {
  type: string;
  count?: number;
}
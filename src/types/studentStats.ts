export interface StudentStats {
  student_id: string;
  total_exams: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
  generated_at: string;
}

export interface StudentStatsFilters {
  start_date?: string;
  end_date?: string;
}
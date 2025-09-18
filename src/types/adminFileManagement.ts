// Admin File Management Types
export interface AdminExportFile {
  file_id: string;
  display_name: string;
  system_filename: string;
  created_by_admin: string;
  file_metadata: {
    size: number;
    format: 'excel' | 'csv' | 'json';
    record_count: number;
    created_at: string;
  };
  stats: {
    download_count: number;
    last_downloaded: string | null;
  };
}

export interface AdminFileResponse {
  files: AdminExportFile[];
  total_files: number;
  total_size: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface AdminFileFilters {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: -1 | 1;
  format_filter?: 'excel' | 'csv' | 'json';
  admin_filter?: string;
}

export interface AdminFileDownloadLog {
  log_id: string;
  file_id: string;
  downloaded_by_admin: string;
  download_timestamp: string;
  ip_address: string;
  user_agent: string;
  download_purpose?: string;
  admin_details?: {
    full_name: string;
    email: string;
  };
}

export interface AdminFileAnalytics {
  total_files: number;
  total_storage_used: number;
  average_file_size: number;
  most_downloaded_files: Array<{
    file_id: string;
    display_name: string;
    download_count: number;
  }>;
  recent_exports: AdminExportFile[];
  downloads_by_admin: Record<string, number>;
  exports_by_format: Record<string, number>;
}

export interface BulkDeleteRequest {
  file_ids: string[];
  confirm: boolean;
}

export interface BulkDeleteResponse {
  success_count: number;
  failed_count: number;
  errors: Array<{
    file_id: string;
    error: string;
  }>;
}
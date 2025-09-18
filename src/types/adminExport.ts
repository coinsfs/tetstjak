import { BaseEntity, PaginationResponse } from './common';

// Admin Export File Types
export interface AdminExportFile extends BaseEntity {
  file_id: string;
  display_name: string;
  system_filename: string;
  created_by_admin: string;
  file_metadata: AdminExportFileMetadata;
  stats: AdminExportFileStats;
}

export interface AdminExportFileMetadata {
  size: number;
  format: 'excel' | 'csv' | 'json';
  record_count: number;
  created_at: string;
}

export interface AdminExportFileStats {
  download_count: number;
  last_downloaded: string | null;
}

export interface AdminExportFileResponse extends PaginationResponse {
  files: AdminExportFile[];
  total_files: number;
  total_size: number;
  has_next: boolean;
}

// Download Log Types
export interface AdminFileDownloadLog extends BaseEntity {
  file_id: string;
  downloaded_by_admin: string;
  download_timestamp: string;
  ip_address: string;
  user_agent: string;
  download_purpose?: string;
  admin_details?: {
    _id: string;
    full_name: string;
    email: string;
  };
}

export interface AdminFileDownloadLogsResponse {
  logs: AdminFileDownloadLog[];
  total_logs: number;
  file_info: {
    file_id: string;
    display_name: string;
    system_filename: string;
  };
}

// Analytics Types
export interface AdminExportAnalytics {
  total_files: number;
  total_storage_used: number;
  average_file_size: number;
  most_downloaded_files: MostDownloadedFile[];
  recent_exports: RecentExport[];
  downloads_by_admin: Record<string, number>;
  exports_by_format: Record<string, number>;
}

export interface MostDownloadedFile {
  file_id: string;
  display_name: string;
  download_count: number;
}

export interface RecentExport {
  file_id: string;
  display_name: string;
  format: string;
  created_at: string;
  created_by_admin: string;
}

// Request Types
export interface AdminExportFilesFilters {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: -1 | 1;
  format_filter?: 'excel' | 'csv' | 'json';
  admin_filter?: string;
  search?: string;
}

export interface BulkDeleteRequest {
  file_ids: string[];
  confirm: boolean;
}

export interface BulkDeleteResponse {
  success: boolean;
  deleted_count: number;
  failed_count: number;
  errors?: string[];
  deleted_files: string[];
  failed_files: string[];
}

// File Status Types
export type FileStatus = 'healthy' | 'warning' | 'error';

export interface FileStatusInfo {
  status: FileStatus;
  message?: string;
}

// Utility Types
export interface AdminExportFileWithStatus extends AdminExportFile {
  status: FileStatusInfo;
}
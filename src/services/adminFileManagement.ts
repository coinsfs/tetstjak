import { BaseService } from './base';
import {
  AdminExportFile,
  AdminFileResponse,
  AdminFileFilters,
  AdminFileDownloadLog,
  AdminFileAnalytics,
  BulkDeleteRequest,
  BulkDeleteResponse
} from '@/types/adminFileManagement';

class AdminFileManagementService extends BaseService {
  /**
   * Get list of admin export files with pagination and filtering
   */
  async getAdminFiles(token: string, filters?: AdminFileFilters): Promise<AdminFileResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/admin/exports/files?${queryString}` : '/admin/exports/files';
    return this.get<AdminFileResponse>(endpoint, token);
  }

  /**
   * Get detailed information for specific file
   */
  async getFileDetails(token: string, fileId: string, includeLogs: boolean = false): Promise<AdminExportFile> {
    const params = includeLogs ? { include_logs: 'true' } : {};
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString ? `/admin/exports/files/${fileId}?${queryString}` : `/admin/exports/files/${fileId}`;
    return this.get<AdminExportFile>(endpoint, token);
  }

  /**
   * Download file with comprehensive logging
   */
  async downloadFile(token: string, fileId: string, downloadPurpose?: string): Promise<Blob> {
    const params = downloadPurpose ? { download_purpose: downloadPurpose } : {};
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString ? `/admin/exports/files/${fileId}/download?${queryString}` : `/admin/exports/files/${fileId}/download`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Download failed' }));
      throw new Error(error.detail || 'Failed to download file');
    }

    return response.blob();
  }

  /**
   * Delete specific admin export file
   */
  async deleteFile(token: string, fileId: string): Promise<void> {
    await this.delete(`/admin/exports/files/${fileId}`, token);
  }

  /**
   * Bulk delete multiple files
   */
  async bulkDeleteFiles(token: string, request: BulkDeleteRequest): Promise<BulkDeleteResponse> {
    return this.post<BulkDeleteResponse>('/admin/exports/files/bulk-delete', request, token);
  }

  /**
   * Delete all admin export files (DANGEROUS)
   */
  async deleteAllFiles(token: string, confirm: boolean, adminFilter?: string): Promise<void> {
    const params: any = { confirm: confirm.toString() };
    if (adminFilter) {
      params.admin_filter = adminFilter;
    }
    const queryString = this.buildQueryParams(params);
    await this.delete(`/admin/exports/files/all?${queryString}`, token);
  }

  /**
   * Get comprehensive export analytics
   */
  async getAnalytics(token: string): Promise<AdminFileAnalytics> {
    return this.get<AdminFileAnalytics>('/admin/exports/analytics', token);
  }

  /**
   * Get download logs for specific file
   */
  async getFileLogs(token: string, fileId: string, limit: number = 50): Promise<AdminFileDownloadLog[]> {
    const params = { limit: limit.toString() };
    const queryString = this.buildQueryParams(params);
    return this.get<AdminFileDownloadLog[]>(`/admin/exports/files/${fileId}/logs?${queryString}`, token);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file format icon
   */
  getFormatIcon(format: string): string {
    switch (format) {
      case 'excel': return '📊';
      case 'csv': return '📋';
      case 'json': return '🔧';
      default: return '📄';
    }
  }

  /**
   * Get file status based on metadata
   */
  getFileStatus(file: AdminExportFile): 'healthy' | 'warning' | 'error' {
    // Large file warning (>50MB)
    if (file.file_metadata.size > 50 * 1024 * 1024) {
      return 'warning';
    }
    
    // High download count warning (>100 downloads)
    if (file.stats.download_count > 100) {
      return 'warning';
    }
    
    return 'healthy';
  }
}

export const adminFileManagementService = new AdminFileManagementService();
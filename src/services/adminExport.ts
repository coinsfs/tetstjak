import { BaseService } from './base';
import {
  AdminExportFile,
  AdminExportFileResponse,
  AdminExportFilesFilters,
  AdminFileDownloadLogsResponse,
  AdminExportAnalytics,
  BulkDeleteRequest,
  BulkDeleteResponse
} from '@/types/adminExport';

class AdminExportService extends BaseService {
  /**
   * Get list of admin export files with pagination and filtering
   */
  async getAdminExportFiles(token: string, filters?: AdminExportFilesFilters): Promise<AdminExportFileResponse> {
    const queryString = this.buildQueryParams(filters || {});
    const endpoint = queryString ? `/admin/exports/files?${queryString}` : '/admin/exports/files';
    return this.get<AdminExportFileResponse>(endpoint, token);
  }

  /**
   * Get detailed information for a specific file
   */
  async getAdminExportFileById(
    token: string, 
    fileId: string, 
    includeLogs: boolean = false
  ): Promise<AdminExportFile> {
    const params = includeLogs ? { include_logs: 'true' } : {};
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString 
      ? `/admin/exports/files/${fileId}?${queryString}` 
      : `/admin/exports/files/${fileId}`;
    return this.get<AdminExportFile>(endpoint, token);
  }

  /**
   * Download a specific admin export file
   */
  async downloadAdminExportFile(
    token: string, 
    fileId: string, 
    downloadPurpose?: string
  ): Promise<Blob> {
    const params = downloadPurpose ? { download_purpose: downloadPurpose } : {};
    const queryString = this.buildQueryParams(params);
    const endpoint = queryString 
      ? `/admin/exports/files/${fileId}/download?${queryString}` 
      : `/admin/exports/files/${fileId}/download`;

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
   * Delete a specific admin export file
   */
  async deleteAdminExportFile(token: string, fileId: string): Promise<void> {
    await this.delete(`/admin/exports/files/${fileId}`, token);
  }

  /**
   * Bulk delete multiple admin export files
   */
  async bulkDeleteAdminExportFiles(
    token: string, 
    request: BulkDeleteRequest
  ): Promise<BulkDeleteResponse> {
    return this.post<BulkDeleteResponse>('/admin/exports/files/bulk-delete', request, token);
  }

  /**
   * Delete all admin export files (DANGEROUS)
   */
  async deleteAllAdminExportFiles(
    token: string, 
    confirm: boolean = true, 
    adminFilter?: string
  ): Promise<BulkDeleteResponse> {
    const params: any = { confirm: confirm.toString() };
    if (adminFilter) {
      params.admin_filter = adminFilter;
    }
    const queryString = this.buildQueryParams(params);
    return this.delete<BulkDeleteResponse>(`/admin/exports/files/all?${queryString}`, token);
  }

  /**
   * Get comprehensive export analytics
   */
  async getAdminExportAnalytics(token: string): Promise<AdminExportAnalytics> {
    return this.get<AdminExportAnalytics>('/admin/exports/analytics', token);
  }

  /**
   * Get download logs for a specific file
   */
  async getAdminExportFileLogs(
    token: string, 
    fileId: string, 
    limit: number = 50
  ): Promise<AdminFileDownloadLogsResponse> {
    const params = { limit: limit.toString() };
    const queryString = this.buildQueryParams(params);
    return this.get<AdminFileDownloadLogsResponse>(
      `/admin/exports/files/${fileId}/logs?${queryString}`, 
      token
    );
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file status based on metadata
   */
  getFileStatus(file: AdminExportFile): { status: 'healthy' | 'warning' | 'error'; message?: string } {
    // File size warnings (>50MB)
    if (file.file_metadata.size > 50 * 1024 * 1024) {
      return {
        status: 'warning',
        message: 'Large file size'
      };
    }

    // High download count warnings (>100 downloads)
    if (file.stats.download_count > 100) {
      return {
        status: 'warning',
        message: 'High download activity'
      };
    }

    // Default healthy status
    return {
      status: 'healthy'
    };
  }

  /**
   * Download file and trigger browser download
   */
  async downloadAndSaveFile(
    token: string, 
    fileId: string, 
    filename: string, 
    downloadPurpose?: string
  ): Promise<void> {
    try {
      const blob = await this.downloadAdminExportFile(token, fileId, downloadPurpose);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }
}

export const adminExportService = new AdminExportService();
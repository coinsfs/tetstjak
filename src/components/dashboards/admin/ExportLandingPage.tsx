import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/contexts/AuthContext';
import { adminExportService } from '@/services/adminExport';
import { 
  AdminExportFile, 
  AdminExportFileResponse, 
  AdminExportFilesFilters,
  AdminExportAnalytics,
  BulkDeleteRequest
} from '@/types/adminExport';
import { 
  Database, 
  ArrowRight, 
  Settings, 
  Download, 
  Search,
  Filter,
  Trash2,
  Eye,
  FileText,
  Calendar,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExportLandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { token } = useAuth();
  
  // State management
  const [files, setFiles] = useState<AdminExportFile[]>([]);
  const [analytics, setAnalytics] = useState<AdminExportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Filter and pagination state
  const [filters, setFilters] = useState<AdminExportFilesFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'file_metadata.created_at',
    sort_order: -1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  // Load files data
  const loadFiles = useCallback(async (showLoading = true) => {
    if (!token) return;
    
    try {
      if (showLoading) setLoading(true);
      
      const searchFilters: AdminExportFilesFilters = {
        ...filters,
        search: searchTerm.trim() || undefined,
        format_filter: formatFilter || undefined
      };
      
      const response = await adminExportService.getAdminExportFiles(token, searchFilters);
      setFiles(response.files);
      setTotalFiles(response.total_files);
      setTotalPages(response.total_pages);
      setHasNext(response.has_next);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Gagal memuat daftar file');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [token, filters, searchTerm, formatFilter]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    
    try {
      const analyticsData = await adminExportService.getAdminExportAnalytics(token);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    loadFiles();
    loadAnalytics();
  }, [loadFiles, loadAnalytics]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFiles(false), loadAnalytics()]);
    setRefreshing(false);
    toast.success('Data berhasil diperbarui');
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle format filter
  const handleFormatFilter = (format: string) => {
    setFormatFilter(format);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle file selection
  const handleFileSelect = (fileId: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (selected) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFiles(new Set(files.map(f => f.file_id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  // Handle file download
  const handleDownload = async (file: AdminExportFile) => {
    if (!token) return;
    
    try {
      toast.loading('Mengunduh file...', { id: `download-${file.file_id}` });
      
      await adminExportService.downloadAndSaveFile(
        token,
        file.file_id,
        file.system_filename
      );
      
      toast.success('File berhasil diunduh', { id: `download-${file.file_id}` });
      
      // Refresh data to update download count
      await loadFiles(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Gagal mengunduh file', { id: `download-${file.file_id}` });
    }
  };

  // Handle file delete
  const handleDelete = async (file: AdminExportFile) => {
    if (!token) return;
    
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus file "${file.display_name}"?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    
    if (!confirmed) return;
    
    try {
      toast.loading('Menghapus file...', { id: `delete-${file.file_id}` });
      
      await adminExportService.deleteAdminExportFile(token, file.file_id);
      
      toast.success('File berhasil dihapus', { id: `delete-${file.file_id}` });
      
      // Refresh data
      await loadFiles(false);
      await loadAnalytics();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Gagal menghapus file', { id: `delete-${file.file_id}` });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!token || selectedFiles.size === 0) return;
    
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedFiles.size} file yang dipilih?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    
    if (!confirmed) return;
    
    try {
      setBulkDeleting(true);
      toast.loading('Menghapus file...', { id: 'bulk-delete' });
      
      const request: BulkDeleteRequest = {
        file_ids: Array.from(selectedFiles),
        confirm: true
      };
      
      const result = await adminExportService.bulkDeleteAdminExportFiles(token, request);
      
      if (result.success) {
        toast.success(
          `${result.deleted_count} file berhasil dihapus${result.failed_count > 0 ? `, ${result.failed_count} gagal` : ''}`,
          { id: 'bulk-delete' }
        );
      } else {
        toast.error('Gagal menghapus file', { id: 'bulk-delete' });
      }
      
      // Clear selection and refresh data
      setSelectedFiles(new Set());
      await loadFiles(false);
      await loadAnalytics();
    } catch (error) {
      console.error('Error bulk deleting files:', error);
      toast.error('Gagal menghapus file', { id: 'bulk-delete' });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Handle go to configuration
  const handleGoToConfiguration = () => {
    navigate('/manage/exports/configure');
  };

  // Get file status
  const getFileStatus = (file: AdminExportFile) => {
    return adminExportService.getFileStatus(file);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    return adminExportService.formatFileSize(bytes);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get format badge color
  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'excel':
        return 'bg-green-100 text-green-800';
      case 'csv':
        return 'bg-blue-100 text-blue-800';
      case 'json':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
          <span className="text-sm font-medium text-gray-700">Memuat data export...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Data Export Center</h1>
              <p className="text-sm text-gray-500">Kelola dan unduh file export admin</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleGoToConfiguration}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Buat Export Baru
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-lg font-semibold text-gray-900">{analytics.total_files}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HardDrive className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-lg font-semibold text-gray-900">{formatFileSize(analytics.total_storage_used)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Avg File Size</p>
                  <p className="text-lg font-semibold text-gray-900">{formatFileSize(analytics.average_file_size)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Download className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Most Downloaded</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {analytics.most_downloaded_files[0]?.display_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex-shrink-0 bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari file..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
              />
            </div>
            
            {/* Format Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formatFilter}
                onChange={(e) => handleFormatFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
              >
                <option value="">Semua Format</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedFiles.size} file dipilih
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Terpilih
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Files Table */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={files.length > 0 && selectedFiles.size === files.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => {
                const status = getFileStatus(file);
                return (
                  <tr key={file.file_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.file_id)}
                        onChange={(e) => handleFileSelect(file.file_id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center" title={status.message}>
                        {getStatusIcon(status.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.display_name}>
                        {file.display_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={file.system_filename}>
                        {file.system_filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatBadgeColor(file.file_metadata.format)}`}>
                        {file.file_metadata.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.file_metadata.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.file_metadata.record_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.stats.download_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.file_metadata.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {files.length === 0 && (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada file export</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || formatFilter ? 'Tidak ada file yang sesuai dengan filter' : 'Mulai dengan membuat export baru'}
              </p>
              {!searchTerm && !formatFilter && (
                <div className="mt-6">
                  <button
                    onClick={handleGoToConfiguration}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Buat Export Baru
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {((filters.page || 1) - 1) * (filters.per_page || 20) + 1} - {Math.min((filters.page || 1) * (filters.per_page || 20), totalFiles)} dari {totalFiles} file
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {filters.page} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={!hasNext}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportLandingPage;
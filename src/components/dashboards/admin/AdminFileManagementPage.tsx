import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { adminFileManagementService } from '@/services/adminFileManagement';
import {
  AdminExportFile,
  AdminFileResponse,
  AdminFileFilters,
  AdminFileAnalytics
} from '@/types/adminFileManagement';
import {
  Database,
  Download,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Calendar,
  User,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminFileManagementPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  
  // State management
  const [files, setFiles] = useState<AdminExportFile[]>([]);
  const [analytics, setAnalytics] = useState<AdminFileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<AdminFileFilters>({
    page: 1,
    per_page: 20,
    sort_by: 'file_metadata.created_at',
    sort_order: -1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total_files: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false
  });

  // Load data
  useEffect(() => {
    loadFiles();
    loadAnalytics();
  }, [filters]);

  const loadFiles = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await adminFileManagementService.getAdminFiles(token, filters);
      setFiles(response.files);
      setPagination({
        total_files: response.total_files,
        total_pages: Math.ceil(response.total_files / response.per_page),
        current_page: response.page,
        has_next: response.has_next
      });
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Gagal memuat daftar file');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!token) return;
    
    try {
      const analyticsData = await adminFileManagementService.getAnalytics(token);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleDownload = async (file: AdminExportFile) => {
    if (!token) return;
    
    try {
      const blob = await adminFileManagementService.downloadFile(token, file.file_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.display_name + '.' + file.file_metadata.format;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File berhasil didownload');
      
      // Refresh data to update download count
      loadFiles();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Gagal mendownload file');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!token) return;
    
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) {
      return;
    }
    
    try {
      await adminFileManagementService.deleteFile(token, fileId);
      toast.success('File berhasil dihapus');
      loadFiles();
      loadAnalytics();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Gagal menghapus file');
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedFiles.size === 0) return;
    
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedFiles.size} file?`)) {
      return;
    }
    
    try {
      const response = await adminFileManagementService.bulkDeleteFiles(token, {
        file_ids: Array.from(selectedFiles),
        confirm: true
      });
      
      toast.success(`${response.success_count} file berhasil dihapus`);
      if (response.failed_count > 0) {
        toast.error(`${response.failed_count} file gagal dihapus`);
      }
      
      setSelectedFiles(new Set());
      loadFiles();
      loadAnalytics();
    } catch (error) {
      console.error('Error bulk deleting files:', error);
      toast.error('Gagal menghapus file');
    }
  };

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.file_id)));
    }
  };

  const getStatusIcon = (file: AdminExportFile) => {
    const status = adminFileManagementService.getFileStatus(file);
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">File Management</h1>
              <p className="text-sm text-gray-500">Kelola file export admin dengan tracking lengkap</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadFiles()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            {selectedFiles.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedFiles.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total Files</p>
                  <p className="text-2xl font-semibold text-blue-900">{analytics.total_files}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Storage Used</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {adminFileManagementService.formatFileSize(analytics.total_storage_used)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Avg File Size</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    {adminFileManagementService.formatFileSize(analytics.average_file_size)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <Download className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">Most Downloaded</p>
                  <p className="text-lg font-semibold text-orange-900 truncate">
                    {analytics.most_downloaded_files[0]?.display_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.format_filter || ''}
              onChange={(e) => setFilters({...filters, format_filter: e.target.value as any})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Formats</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            
            <select
              value={filters.sort_by || ''}
              onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="file_metadata.created_at">Created Date</option>
              <option value="display_name">Name</option>
              <option value="file_metadata.size">Size</option>
              <option value="stats.download_count">Downloads</option>
            </select>
            
            <select
              value={filters.sort_order || -1}
              onChange={(e) => setFilters({...filters, sort_order: parseInt(e.target.value) as -1 | 1})}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={-1}>Descending</option>
              <option value={1}>Ascending</option>
            </select>
          </div>
        )}
      </div>

      {/* File Table */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2 text-gray-500">Loading files...</span>
                    </div>
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No files found</p>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.file_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.file_id)}
                        onChange={() => handleSelectFile(file.file_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {adminFileManagementService.getFormatIcon(file.file_metadata.format)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {file.file_metadata.record_count.toLocaleString()} records
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {adminFileManagementService.formatFileSize(file.file_metadata.size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {file.stats.download_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(file.file_metadata.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusIcon(file)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.file_id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_files > 0 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current_page - 1) * (filters.per_page || 20)) + 1} to{' '}
              {Math.min(pagination.current_page * (filters.per_page || 20), pagination.total_files)} of{' '}
              {pagination.total_files} files
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters({...filters, page: (filters.page || 1) - 1})}
                disabled={pagination.current_page <= 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => setFilters({...filters, page: (filters.page || 1) + 1})}
                disabled={!pagination.has_next}
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

export default AdminFileManagementPage;
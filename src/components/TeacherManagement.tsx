import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Teacher, TeacherFilters } from '@/types/user';
import { userService } from '@/services/user';
import TeacherFilter from './TeacherFilter';
import TeacherTable from './tables/TeacherTable';
import Pagination from './Pagination';
import TeacherDetailModal from './modals/details/TeacherDetailModal';
import TeacherFormModal from './modals/forms/TeacherFormModal';
import TeacherDeleteModal from './modals/TeacherDeleteModal';
import ImportDataModal from './modals/ImportDataModal';
import toast from 'react-hot-toast';
import { Plus, Users, AlertCircle, FileSpreadsheet } from 'lucide-react';

const TeacherManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<TeacherFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('teachers');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0) {
      console.log('Using cached teachers data');
      setTeachers(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const teacherFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await userService.getTeachers(token, teacherFilters);
      
      setTeachers(response.data as Teacher[]);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teachers';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters, getCachedData]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleFiltersChange = useCallback((newFilters: TeacherFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages]);

  const handleLimitChange = useCallback((newLimit: number) => {
    if (newLimit !== recordsPerPage) {
      setRecordsPerPage(newLimit);
      setCurrentPage(1); // Reset to first page when limit changes
    }
  }, [recordsPerPage]);

  const handleViewTeacher = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDetailModalOpen(true);
  }, []);

  const handleEditTeacher = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormModalOpen(true);
  }, []);

  const handleToggleStatus = useCallback(async (teacher: Teacher) => {
    if (!token) return;

    try {
      const newStatus = !teacher.is_active;
      await userService.toggleTeacherStatus(token, teacher._id, newStatus);
      
      toast.success(
        `Guru ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} berhasil`
      );
      
      // Refresh data
      fetchTeachers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengubah status guru';
      toast.error(errorMessage);
      console.error('Error toggling teacher status:', err);
    }
  }, [token, fetchTeachers]);

  const handleDeleteTeacher = useCallback((teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteModalOpen(true);
  }, []);

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleFormSuccess = () => {
    fetchTeachers();
  };

  const handleDeleteSuccess = () => {
    fetchTeachers();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Teachers</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTeachers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Guru</h1>
            <p className="text-gray-600">Manajemen data guru sekolah</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => setImportModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Data</span>
          </button>
          
          <button 
            onClick={handleAddTeacher}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guru</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Halaman Saat Ini</p>
              <p className="text-2xl font-bold text-gray-900">{currentPage} dari {totalPages}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">{currentPage}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data per Halaman</p>
              <p className="text-2xl font-bold text-gray-900">{recordsPerPage}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">{teachers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TeacherFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Teacher Table */}
      <TeacherTable
        teachers={teachers}
        loading={loading}
        onViewTeacher={handleViewTeacher}
        onEditTeacher={handleEditTeacher}
        onToggleStatus={handleToggleStatus}
        onDeleteTeacher={handleDeleteTeacher}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Modals */}
      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <TeacherFormModal
        teacher={selectedTeacher}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedTeacher && (
        <TeacherDeleteModal
          teacher={selectedTeacher}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <ImportDataModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleFormSuccess}
        type="teachers"
        title="Guru"
      />
    </div>
  );
};

export default TeacherManagement;
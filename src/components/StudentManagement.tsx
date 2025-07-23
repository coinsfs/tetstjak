import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Student, StudentFilters } from '@/types/user';
import { userService } from '@/services/user';
import StudentFilter from './StudentFilter';
import StudentTable from './tables/StudentTable';
import Pagination from './Pagination';
import StudentDetailModal from './modals/details/StudentDetailModal';
import StudentFormModal from './modals/forms/StudentFormModal';
import StudentDeleteModal from './modals/StudentDeleteModal';
import toast from 'react-hot-toast';
import { Plus, Users, AlertCircle } from 'lucide-react';

const StudentManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<StudentFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('students');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0) {
      console.log('Using cached students data');
      setStudents(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const studentFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await userService.getStudents(token, studentFilters);
      
      setStudents(response.data as Student[]);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters, getCachedData]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFiltersChange = useCallback((newFilters: StudentFilters) => {
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

  const handleViewStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
  }, []);

  const handleEditStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setFormModalOpen(true);
  }, []);

  const handleToggleStatus = useCallback(async (student: Student) => {
    if (!token) return;

    try {
      const newStatus = !student.is_active;
      await userService.toggleStudentStatus(token, student._id, newStatus);
      
      toast.success(
        `Student ${newStatus ? 'activated' : 'deactivated'} successfully`
      );
      
      // Refresh data
      fetchStudents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student status';
      toast.error(errorMessage);
      console.error('Error toggling student status:', err);
    }
  }, [token, fetchStudents]);

  const handleDeleteStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  }, []);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedStudent(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedStudent(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDeleteSuccess = () => {
    fetchStudents();
  };

  const handleFormSuccess = () => {
    fetchStudents();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Students</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStudents}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Siswa</h1>
            <p className="text-gray-600">Manajemen data siswa sekolah</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddStudent}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
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
              <span className="text-sm font-bold text-purple-600">{students.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <StudentFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Student Table */}
      <StudentTable
        students={students}
        loading={loading}
        onViewStudent={handleViewStudent}
        onEditStudent={handleEditStudent}
        onToggleStatus={handleToggleStatus}
        onDeleteStudent={handleDeleteStudent}
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
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <StudentFormModal
        student={selectedStudent}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedStudent && (
        <StudentDeleteModal
          student={selectedStudent}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default StudentManagement;
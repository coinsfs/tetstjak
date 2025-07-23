import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Class, ClassFilters, ClassResponse } from '@/types/class';
import { classService } from '@/services/class';
import ClassFilter from './ClassFilter';
import ClassTable from './tables/ClassTable';
import Pagination from './Pagination';
import ClassDetailModal from './modals/details/ClassDetailModal';
import ClassFormModal from './modals/forms/ClassFormModal';
import ClassDeleteModal from './modals/ClassDeleteModal';
import toast from 'react-hot-toast';
import { Plus, School, AlertCircle } from 'lucide-react';

const ClassManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [gradeStats, setGradeStats] = useState({
    grade_10_total: 0,
    grade_11_total: 0,
    grade_12_total: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState<ClassFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('classes');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0) {
      console.log('Using cached classes data');
      setClasses(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setGradeStats({
        grade_10_total: cachedData.grade_10_total,
        grade_11_total: cachedData.grade_11_total,
        grade_12_total: cachedData.grade_12_total
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const classFilters: ClassFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await classService.getClasses(token, classFilters);
      
      // Handle empty or invalid response
      if (!response || !response.data) {
        setClasses([]);
        setTotalRecords(0);
        setTotalPages(0);
        setGradeStats({
          grade_10_total: 0,
          grade_11_total: 0,
          grade_12_total: 0
        });
        return;
      }
      
      setClasses(response.data);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      setGradeStats({
        grade_10_total: response.grade_10_total,
        grade_11_total: response.grade_11_total,
        grade_12_total: response.grade_12_total
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch classes';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching classes:', err);
      
      // Set empty state on error
      setClasses([]);
      setTotalRecords(0);
      setTotalPages(0);
      setGradeStats({
        grade_10_total: 0,
        grade_11_total: 0,
        grade_12_total: 0
      });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters, getCachedData]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleFiltersChange = useCallback((newFilters: ClassFilters) => {
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

  const handleViewClass = useCallback((classData: Class) => {
    setSelectedClass(classData);
    setDetailModalOpen(true);
  }, []);

  const handleEditClass = useCallback((classData: Class) => {
    setSelectedClass(classData);
    setFormModalOpen(true);
  }, []);

  const handleDeleteClass = useCallback((classData: Class) => {
    setSelectedClass(classData);
    setDeleteModalOpen(true);
  }, []);

  const handleAddClass = () => {
    setSelectedClass(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedClass(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedClass(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedClass(null);
  };

  const handleFormSuccess = () => {
    fetchClasses();
  };

  const handleDeleteSuccess = () => {
    fetchClasses();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Classes</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchClasses}
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
          <School className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Kelas</h1>
            <p className="text-gray-600">Manajemen kelas sekolah</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddClass}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <School className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kelas X</p>
              <p className="text-2xl font-bold text-gray-900">{gradeStats.grade_10_total}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">X</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kelas XI & XII</p>
              <p className="text-2xl font-bold text-gray-900">
                {gradeStats.grade_11_total + gradeStats.grade_12_total}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">XI+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ClassFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Class Table */}
      <ClassTable
        classes={classes}
        loading={loading}
        onViewClass={handleViewClass}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
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
      {selectedClass && (
        <ClassDetailModal
          classData={selectedClass}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <ClassFormModal
        classData={selectedClass}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedClass && (
        <ClassDeleteModal
          classData={selectedClass}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default ClassManagement;
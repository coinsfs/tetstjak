import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Subject, SubjectFilters } from '@/types/subject';
import { subjectService } from '@/services/subject';
import SubjectFilter from './SubjectFilter';
import SubjectTable from './tables/SubjectTable';
import Pagination from './Pagination';
import SubjectDetailModal from './modals/details/SubjectDetailModal';
import SubjectFormModal from './modals/forms/SubjectFormModal';
import SubjectDeleteModal from './modals/SubjectDeleteModal';
import toast from 'react-hot-toast';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';

const SubjectManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<SubjectFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('subjects');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0) {
      console.log('Using cached subjects data');
      setSubjects(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const subjectFilters: SubjectFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await subjectService.getSubjects(token, subjectFilters);
      
      setSubjects(response.data);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subjects';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters, getCachedData]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleFiltersChange = useCallback((newFilters: SubjectFilters) => {
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

  const handleViewSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setDetailModalOpen(true);
  }, []);

  const handleEditSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setFormModalOpen(true);
  }, []);

  const handleDeleteSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteModalOpen(true);
  }, []);

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedSubject(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedSubject(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedSubject(null);
  };

  const handleFormSuccess = () => {
    fetchSubjects();
  };

  const handleDeleteSuccess = () => {
    fetchSubjects();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Subjects</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubjects}
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
          <BookOpen className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Mata Pelajaran</h1>
            <p className="text-gray-600">Manajemen mata pelajaran sekolah</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddSubject}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-500" />
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
              <span className="text-sm font-bold text-purple-600">{subjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <SubjectFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Subject Table */}
      <SubjectTable
        subjects={subjects}
        onViewSubject={handleViewSubject}
        onEditSubject={handleEditSubject}
        onDeleteSubject={handleDeleteSubject}
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
      {selectedSubject && (
        <SubjectDetailModal
          subject={selectedSubject}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <SubjectFormModal
        subject={selectedSubject}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedSubject && (
        <SubjectDeleteModal
          subject={selectedSubject}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default SubjectManagement;
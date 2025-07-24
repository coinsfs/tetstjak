import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { ExpertiseProgram, ExpertiseProgramFilters } from '@/types/expertise';
import { expertiseProgramService } from '@/services/expertise';
import ExpertiseProgramFilter from './ExpertiseProgramFilter';
import ExpertiseProgramTable from './tables/ExpertiseProgramTable';
import Pagination from './Pagination';
import ExpertiseProgramDetailModal from './modals/details/ExpertiseProgramDetailModal';
import ExpertiseProgramFormModal from './modals/forms/ExpertiseProgramFormModal';
import ExpertiseProgramDeleteModal from './modals/ExpertiseProgramDeleteModal';
import toast from 'react-hot-toast';
import { Plus, GraduationCap, AlertCircle } from 'lucide-react';

const ExpertiseProgramManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [expertisePrograms, setExpertisePrograms] = useState<ExpertiseProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<ExpertiseProgramFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpertiseProgram, setSelectedExpertiseProgram] = useState<ExpertiseProgram | null>(null);

  const fetchExpertisePrograms = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const expertiseProgramFilters: ExpertiseProgramFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await expertiseProgramService.getExpertisePrograms(token, expertiseProgramFilters);
      
      setExpertisePrograms(response.data);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expertise programs';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching expertise programs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters]);

  useEffect(() => {
    fetchExpertisePrograms();
  }, [fetchExpertisePrograms]);

  const handleFiltersChange = useCallback((newFilters: ExpertiseProgramFilters) => {
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

  const handleViewExpertiseProgram = useCallback((expertiseProgram: ExpertiseProgram) => {
    setSelectedExpertiseProgram(expertiseProgram);
    setDetailModalOpen(true);
  }, []);

  const handleEditExpertiseProgram = useCallback((expertiseProgram: ExpertiseProgram) => {
    setSelectedExpertiseProgram(expertiseProgram);
    setFormModalOpen(true);
  }, []);

  const handleDeleteExpertiseProgram = useCallback((expertiseProgram: ExpertiseProgram) => {
    setSelectedExpertiseProgram(expertiseProgram);
    setDeleteModalOpen(true);
  }, []);

  const handleAddExpertiseProgram = () => {
    setSelectedExpertiseProgram(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedExpertiseProgram(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedExpertiseProgram(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedExpertiseProgram(null);
  };

  const handleFormSuccess = () => {
    fetchExpertisePrograms();
  };

  const handleDeleteSuccess = () => {
    fetchExpertisePrograms();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Expertise Programs</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchExpertisePrograms}
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
          <GraduationCap className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Jurusan</h1>
            <p className="text-gray-600">Manajemen program keahlian sekolah</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddExpertiseProgram}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jurusan</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jurusan</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-500" />
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
              <span className="text-sm font-bold text-purple-600">{expertisePrograms.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ExpertiseProgramFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Expertise Program Table */}
      <ExpertiseProgramTable
        expertisePrograms={expertisePrograms}
        loading={loading}
        onViewExpertiseProgram={handleViewExpertiseProgram}
        onEditExpertiseProgram={handleEditExpertiseProgram}
        onDeleteExpertiseProgram={handleDeleteExpertiseProgram}
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
      {selectedExpertiseProgram && (
        <ExpertiseProgramDetailModal
          expertiseProgram={selectedExpertiseProgram}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <ExpertiseProgramFormModal
        expertiseProgram={selectedExpertiseProgram}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedExpertiseProgram && (
        <ExpertiseProgramDeleteModal
          expertiseProgram={selectedExpertiseProgram}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default ExpertiseProgramManagement;
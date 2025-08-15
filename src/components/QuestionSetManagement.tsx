import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { QuestionSet, QuestionSetFilters } from '@/types/questionSet';
import { questionSetService } from '@/services/questionSet';
import QuestionSetFilter from './QuestionSetFilter';
import QuestionSetTable from './tables/QuestionSetTable';
import Pagination from './Pagination';
import QuestionSetDetailModal from './modals/details/QuestionSetDetailModal';
import QuestionSetFormModal from './modals/forms/QuestionSetFormModal';
import QuestionSetDeleteModal from './modals/QuestionSetDeleteModal';
import toast from 'react-hot-toast';
import { Plus, BookOpen, AlertCircle, Users, FileText, Eye } from 'lucide-react';

const QuestionSetManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<QuestionSetFilters>({});
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionSet | null>(null);

  const fetchQuestionSets = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('questionSets');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0) {
      console.log('Using cached question sets data');
      setQuestionSets(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const questionSetFilters: QuestionSetFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };
      
      const response = await questionSetService.getQuestionSets(token, questionSetFilters);
      
      setQuestionSets(response.data);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch question sets';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching question sets:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, filters, getCachedData]);

  useEffect(() => {
    fetchQuestionSets();
  }, [fetchQuestionSets]);

  const handleFiltersChange = useCallback((newFilters: QuestionSetFilters) => {
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

  const handleViewQuestionSet = useCallback((questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setDetailModalOpen(true);
  }, []);

  const handleEditQuestionSet = useCallback((questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setFormModalOpen(true);
  }, []);

  const handleDeleteQuestionSet = useCallback((questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setDeleteModalOpen(true);
  }, []);

  const handleAddQuestionSet = () => {
    setSelectedQuestionSet(null);
    setFormModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedQuestionSet(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedQuestionSet(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedQuestionSet(null);
  };

  const handleFormSuccess = () => {
    fetchQuestionSets();
  };

  const handleDeleteSuccess = () => {
    fetchQuestionSets();
  };

  // Calculate stats
  const stats = {
    totalQuestionSets: totalRecords,
    draftSets: questionSets.filter(qs => qs.status === 'draft').length,
    publishedSets: questionSets.filter(qs => qs.status === 'published').length,
    publicSets: questionSets.filter(qs => qs.is_public).length
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Question Sets</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchQuestionSets}
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Paket Soal</h1>
            <p className="text-gray-600">Manajemen paket soal dan bank soal</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          <button 
            onClick={handleAddQuestionSet}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Soal</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paket Soal</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestionSets.toLocaleString()}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draftSets}</p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publishedSets}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-600">P</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Public</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publicSets}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <QuestionSetFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* Question Set Table */}
      <QuestionSetTable
        questionSets={questionSets}
        loading={loading}
        onViewQuestionSet={handleViewQuestionSet}
        onEditQuestionSet={handleEditQuestionSet}
        onDeleteQuestionSet={handleDeleteQuestionSet}
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
      {selectedQuestionSet && (
        <QuestionSetDetailModal
          questionSet={selectedQuestionSet}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      <QuestionSetFormModal
        questionSet={selectedQuestionSet}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedQuestionSet && (
        <QuestionSetDeleteModal
          questionSet={selectedQuestionSet}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default QuestionSetManagement;
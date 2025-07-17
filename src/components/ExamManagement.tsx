import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Exam, ExamFilters } from '../types/exam';
import { examService } from '../services/examService';
import ExamTable from './ExamTable';
import ExamPagination from './ExamPagination';
import ExamFormModal from './modals/ExamFormModal';
import ExamDeleteModal from './modals/ExamDeleteModal';
import toast from 'react-hot-toast';
import { Plus, FileText, AlertCircle, Search } from 'lucide-react';

const ExamManagement: React.FC = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const fetchExams = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const filters: ExamFilters = {
        page: currentPage,
        limit: recordsPerPage
      };

      if (searchValue.trim()) {
        filters.search = searchValue.trim();
      }
      
      const response = await examService.getExams(token, filters);
      
      setExams(response.data);
      setTotalRecords(response.total_items);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exams';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, recordsPerPage, searchValue]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounce
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer]);

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

  const handleAddExam = () => {
    setSelectedExam(null);
    setFormModalOpen(true);
  };

  const handleEditExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setFormModalOpen(true);
  }, []);

  const handleDeleteExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setDeleteModalOpen(true);
  }, []);

  const handleAnalyticsExam = useCallback((exam: Exam) => {
    // TODO: Implement analytics navigation
    console.log('View analytics for exam:', exam._id);
    toast.success(`Analytics untuk "${exam.title}" akan segera tersedia`);
  }, []);

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedExam(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedExam(null);
  };

  const handleFormSuccess = () => {
    fetchExams();
  };

  const handleDeleteSuccess = () => {
    fetchExams();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Exams</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchExams}
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
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Ujian</h1>
            <p className="text-gray-600">Manajemen ujian dan evaluasi</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddExam}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ujian</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ujian</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
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
              <span className="text-sm font-bold text-purple-600">{exams.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Pencarian Ujian</h3>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul ujian, mata pelajaran, atau nama guru..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Exam Table */}
      <ExamTable
        exams={exams}
        loading={loading}
        onEditExam={handleEditExam}
        onDeleteExam={handleDeleteExam}
        onAnalyticsExam={handleAnalyticsExam}
      />

      {/* Pagination */}
      <ExamPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Modals */}
      <ExamFormModal
        exam={selectedExam}
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedExam && (
        <ExamDeleteModal
          exam={selectedExam}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default ExamManagement;
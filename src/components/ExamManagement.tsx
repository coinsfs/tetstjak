import { FileText, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Exam, ExamFilters, AcademicPeriod } from '@/types/exam';
import { examService } from '@/services/exam';
import ExamTable from './tables/ExamTable';
import ExamTable from './tables/ExamTable';
import Pagination from './Pagination';
import ExamFormModal from './modals/forms/ExamFormModal';
import ExamDeleteModal from './modals/ExamDeleteModal';
import ExamDetailModal from './modals/details/ExamDetailModal';
import Pagination from './Pagination';
import toast from 'react-hot-toast';
import { Plus, FileText, AlertCircle, Search, Filter, RotateCcw } from 'lucide-react';

const ExamManagement: React.FC = () => {
  const { token } = useAuth();
  const { getCachedData } = usePrefetch(token);
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
    page: 1,
    limit: 10
  // Filter state
  const [filters, setFilters] = useState<ExamFilters>({});
  
  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [prefetchedExams, setPrefetchedExams] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const fetchExams = useCallback(async () => {
    if (!token) return;

    // Check if we have cached data for initial load
    const cachedData = getCachedData('exams');
    if (cachedData && currentPage === 1 && recordsPerPage === 10 && Object.keys(filters).length === 0 && !debouncedSearch) {
      console.log('Using cached exams data');
      setExams(cachedData.data);
      setTotalRecords(cachedData.total_items);
      setTotalPages(cachedData.total_pages);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const examFilters: ExamFilters = {
        page: currentPage,
        limit: recordsPerPage,
        ...filters
      };

      if (debouncedSearch.trim()) {
        examFilters.search = debouncedSearch.trim();
      }
      
      const response = await examService.getExams(token, examFilters);
      
      setExams(response.data);
      setTotalItems(response.total_items);
      setTotalPages(response.total_pages);
      setCurrentPage(response.current_page);
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
  }, [token, currentPage, recordsPerPage, debouncedSearch, filters, getCachedData]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      if (!token) return;
      
      try {
        const periods = await examService.getAcademicPeriods(token);
        setAcademicPeriods(periods);
      } catch (error) {
        console.error('Error fetching academic periods:', error);
      }
    };

    fetchAcademicPeriods();
  }, [token]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleFilterChange = useCallback((key: keyof ExamFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchValue('');
    setDebouncedSearch('');
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

  const handleAddExam = () => {
    setSelectedExam(null);
    setFormModalOpen(true);
  };

  const handleViewExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setDetailModalOpen(true);
  }, []);

  const handlePrefetchExam = useCallback(async (examId: string) => {
    if (!token || prefetchedExams.has(examId)) return;

    try {
      // Mark as prefetched to avoid duplicate requests
      setPrefetchedExams(prev => new Set(prev).add(examId));
      
      // Find the exam to get question IDs
      const exam = exams.find(e => e._id === examId);
      if (exam && exam.questions && exam.questions.length > 0) {
        // Prefetch questions
        await examService.getQuestionsByIds(token, exam.questions);
      }
    } catch (error) {
      // Silently handle prefetch errors
      console.log('Prefetch failed for exam:', examId);
    }
  }, [token, exams, prefetchedExams]);

  const handleEditExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setFormModalOpen(true);
  }, []);

  const handleDeleteExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
      page: 1
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

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedExam(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedExam(null);
  };

  const handleFormSuccess = () => {
      page: 1
    fetchExams();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  const handleDeleteSuccess = () => {
    fetchExams();
  };

  if (error) {
  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowEditModal(true);
  };
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
      page: 1,
      limit: 10
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

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
      <ExamTable
        exams={exams}
        loading={loading}
        onViewExam={handleViewExam}
        onEditExam={handleEditExam}
        onDeleteExam={handleDeleteExam}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={filters.limit || 10}
          onPageChange={handlePageChange}
        />
      )}

      {/* Exam Table */}
      <ExamTable
        exams={exams}
        loading={loading}
        onViewExam={handleViewExam}
        onPrefetchExam={handlePrefetchExam}
        onEditExam={handleEditExam}
        onDeleteExam={handleDeleteExam}
        onAnalyticsExam={handleAnalyticsExam}
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
      <ExamFormModal
        exam={selectedExam}
          mode="create"
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
      />

      {selectedExam && (
        <ExamDetailModal
          exam={selectedExam}
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
        />
      )}

      {showEditModal && selectedExam && (
        <ExamFormModal
          mode="edit"
          exam={selectedExam}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedExam(null);
            fetchExams();
          }}
        />
      )}

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
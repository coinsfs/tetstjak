import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types/auth';
import { FileText, Clock, AlertCircle, Search, Filter, RotateCcw, Play, BarChart3, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentExamService, StudentExam, StudentExamFilters, AcademicPeriod } from '@/services/studentExam';
import toast from 'react-hot-toast';

interface StudentExamsPageProps {
  user: UserProfile | null;
}

const StudentExamsPage: React.FC<StudentExamsPageProps> = ({ user }) => {
  const { token } = useAuth();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState<StudentExamFilters>({
    academic_period_id: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [searchValue, setSearchValue] = useState('');

  // Initialize with active academic period
  useEffect(() => {
    const initializeData = async () => {
      if (!token) return;

      try {
        // Fetch academic periods
        const periods = await studentExamService.getAcademicPeriods(token);
        setAcademicPeriods(periods);

        // Get active academic period
        const activePeriod = await studentExamService.getActiveAcademicPeriod(token);
        if (activePeriod) {
          setFilters(prev => ({
            ...prev,
            academic_period_id: activePeriod._id
          }));
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Gagal memuat data');
      }
    };

    initializeData();
  }, [token]);

  // Fetch exams when filters change
  useEffect(() => {
    const fetchExams = async () => {
      if (!token || !filters.academic_period_id) return;

      try {
        setLoading(true);
        const response = await studentExamService.getStudentExams(token, filters);
        setExams(response.data);
        setTotalItems(response.total_items);
        setTotalPages(response.total_pages);
        setCurrentPage(response.current_page);
      } catch (error) {
        console.error('Error fetching exams:', error);
        toast.error('Gagal memuat data ujian');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [token, filters]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        setFilters(prev => ({
          ...prev,
          search: searchValue || undefined,
          page: 1
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search]);

  const handleFilterChange = useCallback((key: keyof StudentExamFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    const activePeriod = academicPeriods.find(p => p.status === 'active');
    setFilters({
      academic_period_id: activePeriod?._id || '',
      status: '',
      search: '',
      page: 1,
      limit: 10
    });
    setSearchValue('');
  }, [academicPeriods]);

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'official_uts': return 'UTS';
      case 'official_uas': return 'UAS';
      case 'quiz': return 'Kuis';
      case 'daily_test': return 'Ulangan Harian';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_questions': return 'Menunggu Soal';
      case 'ready': return 'Siap';
      case 'active': return 'Aktif';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_questions': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExamAction = (exam: StudentExam) => {
    // TODO: Implement exam actions based on status
    switch (exam.status) {
      case 'ready':
        toast.success(`Memulai ujian: ${exam.title}`);
        break;
      case 'active':
        toast.success(`Melanjutkan ujian: ${exam.title}`);
        break;
      case 'completed':
        toast.success(`Melihat analitik ujian: ${exam.title}`);
        break;
      default:
        break;
    }
  };

  const getActionButton = (exam: StudentExam) => {
    switch (exam.status) {
      case 'pending_questions':
        return (
          <button
            disabled
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Menunggu Soal
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleExamAction(exam)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Mulai Ujian
          </button>
        );
      case 'active':
        return (
          <button
            onClick={() => handleExamAction(exam)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Lanjutkan
          </button>
        );
      case 'completed':
        return (
          <button
            onClick={() => handleExamAction(exam)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analitik
          </button>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-800 bg-red-100 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            {getStatusLabel(exam.status)}
          </span>
        );
    }
  };

  // Count exams by status
  const examCounts = {
    available: exams.filter(exam => exam.status === 'ready').length,
    ongoing: exams.filter(exam => exam.status === 'active').length,
    completed: exams.filter(exam => exam.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ujian</h2>
            <p className="text-gray-600">Kelola dan ikuti ujian yang tersedia</p>
          </div>
        </div>
      </div>

      {/* Exam Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ujian Tersedia</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">{examCounts.available}</p>
            <p className="text-gray-500">Ujian siap dikerjakan</p>
          </div>
        </div>

        {/* Ongoing Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sedang Berlangsung</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">{examCounts.ongoing}</p>
            <p className="text-gray-500">Ujian aktif</p>
          </div>
        </div>

        {/* Completed Exams */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selesai</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">{examCounts.completed}</p>
            <p className="text-gray-500">Ujian telah selesai</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filter Ujian</h3>
          </div>
          
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Academic Period Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Periode Akademik
            </label>
            <select
              value={filters.academic_period_id}
              onChange={(e) => handleFilterChange('academic_period_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Pilih Periode</option>
              {academicPeriods.map((period) => (
                <option key={period._id} value={period._id}>
                  {period.year} - {period.semester}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Semua Status</option>
              <option value="ready">Siap</option>
              <option value="active">Aktif</option>
              <option value="completed">Selesai</option>
              <option value="pending_questions">Menunggu Soal</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Pencarian
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari judul ujian..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Ujian</h3>
            <span className="text-sm text-gray-500">
              {totalItems} ujian ditemukan
            </span>
          </div>
        </div>
        
        {/* Table Container with Responsive Scroll */}
        <div className="student-exam-table-container">
          <div className="student-exam-table-scroll">
            <div className="student-exam-table-inner">
              {loading ? (
                <div className="text-center py-12 px-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuat ujian...</p>
                </div>
              ) : exams.length > 0 ? (
                <table className="student-exam-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Ujian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Tipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Durasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Jadwal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exams.map((exam) => (
                      <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="student-exam-cell-content" title={exam.title}>
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {exam.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {exam._id.slice(-8)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getExamTypeLabel(exam.exam_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            {exam.duration_minutes} menit
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="student-exam-cell-content clamp-3" title={`Mulai: ${formatDateTime(exam.availability_start_time)} | Selesai: ${formatDateTime(exam.availability_end_time)}`}>
                              <div className="text-xs text-gray-900 leading-relaxed">
                                <p className="mb-1">
                                  <span className="font-medium text-gray-700">Mulai:</span> {formatDateTime(exam.availability_start_time)}
                                </p>
                                <p>
                                  <span className="font-medium text-gray-700">Selesai:</span> {formatDateTime(exam.availability_end_time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                            {getStatusLabel(exam.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="student-exam-action-buttons">
                            {getActionButton(exam)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 px-6">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Ujian</h4>
                  <p className="text-gray-500 mb-4">
                    Tidak ada ujian yang sesuai dengan filter yang dipilih.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && exams.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Menampilkan {((currentPage - 1) * filters.limit!) + 1} - {Math.min(currentPage * filters.limit!, totalItems)} dari {totalItems} ujian
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('page', currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handleFilterChange('page', currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamsPage;
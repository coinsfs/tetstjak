import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types/auth';
import { FileText, Clock, AlertCircle, Search, Filter, RotateCcw, ChevronUp, ChevronDown, Calendar, BookOpen, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentExamService, StudentExam, StudentExamFilters, AcademicPeriod, ExamSession } from '@/services/studentExam';
import { websocketService } from '@/services/websocket';
import { useRouter } from '@/hooks/useRouter';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
import toast from 'react-hot-toast';

interface StudentExamsPageProps {
  user: UserProfile | null;
}

const StudentExamsPage: React.FC<StudentExamsPageProps> = ({ user }) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [startingExam, setStartingExam] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<StudentExamFilters>({
    academic_period_id: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [searchValue, setSearchValue] = useState('');

  // WebSocket setup for exam status updates
  useEffect(() => {
    const handleExamStarted = (data: any) => {
      if (data.type === 'EXAM_STARTED' && data.exam_id) {
        // Update the specific exam status to allow starting
        setExams(prevExams => 
          prevExams.map(exam => 
            exam._id === data.exam_id 
              ? { ...exam, status: 'active' }
              : exam
          )
        );
        toast.success('Ujian sudah dapat dimulai!');
      }
    };

    websocketService.onMessage('EXAM_STARTED', handleExamStarted);
    return () => websocketService.offMessage('EXAM_STARTED');
  }, []);

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

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const getSortedExams = useCallback(() => {
    if (!sortField) return exams;

    return [...exams].sort((a, b) => {
      let aValue: any = a[sortField as keyof StudentExam];
      let bValue: any = b[sortField as keyof StudentExam];

      // Handle nested properties
      if (sortField === 'subject') {
        aValue = a.teaching_assignment_details?.subject_details?.name || '';
        bValue = b.teaching_assignment_details?.subject_details?.name || '';
      }

      // Handle date sorting
      if (sortField === 'availability_start_time' || sortField === 'availability_end_time') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [exams, sortField, sortDirection]);

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const handleStartExam = async (exam: StudentExam) => {
    try {
      setStartingExam(exam._id);
      
      // Start the exam and get session
      const examSession = await studentExamService.startExam(token!, exam._id);
      
      // Calculate timestamps for URL parameters (using base64 encoding for obfuscation)
      const startTime = new Date(exam.availability_start_time).getTime();
      const endTime = new Date(exam.availability_end_time).getTime();
      const duration = exam.duration_minutes * 60 * 1000; // Convert to milliseconds
      
      // Encode parameters to make them less obvious
      const s = btoa(startTime.toString()).replace(/[+=]/g, ''); // Remove padding chars
      const e = btoa(endTime.toString()).replace(/[+=]/g, '');
      const d = btoa(duration.toString()).replace(/[+=]/g, '');
      
      // Navigate to exam taking page with session ID and time parameters
      window.location.href = `/exam-taking/${examSession._id}?s=${s}&e=${e}&d=${d}`;
      
      toast.success('Ujian berhasil dimulai!');
    } catch (error) {
      console.error('Error starting exam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulai ujian';
      toast.error(errorMessage);
    } finally {
      setStartingExam(null);
    }
  };

  const renderActionButton = (exam: StudentExam) => {
    const isStarting = startingExam === exam._id;
    const now = new Date();
    const startTime = new Date(exam.availability_start_time);
    const endTime = new Date(exam.availability_end_time);
    const isTimeValid = now >= startTime && now <= endTime;
    
    switch (exam.status) {
      case 'pending_questions':
        return (
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Menunggu Soal
          </div>
        );
        
      case 'ready':
      case 'active':
        if (!isTimeValid) {
          const timeMessage = now < startTime ? 'Belum Waktunya' : 'Waktu Berakhir';
          return (
            <button 
              disabled
              className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
              title={now < startTime ? `Ujian dimulai pada ${formatDateTime(exam.availability_start_time)}` : 'Waktu ujian telah berakhir'}
            >
              <Clock className="w-4 h-4 mr-2" />
              {timeMessage}
            </button>
          );
        }
        return (
          <button 
            onClick={() => handleStartExam(exam)}
            disabled={isStarting}
            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              exam.status === 'active' 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isStarting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memulai...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {exam.status === 'active' ? 'Lanjutkan Ujian' : 'Mulai Ujian'}
              </>
            )}
          </button>
        );
      
      case 'ongoing':
        if (!isTimeValid) {
          const timeMessage = now < startTime ? 'Belum Waktunya' : 'Waktu Berakhir';
          return (
            <button 
              disabled
              className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
              title={now < startTime ? `Ujian dimulai pada ${formatDateTime(exam.availability_start_time)}` : 'Waktu ujian telah berakhir'}
            >
              <Clock className="w-4 h-4 mr-2" />
              {timeMessage}
            </button>
          );
        }
        return (
          <button 
            onClick={() => handleStartExam(exam)}
            disabled={isStarting}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memulai...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Lanjutkan Ujian
              </>
            )}
          </button>
        );
      
      case 'completed':
        return (
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Selesai
          </div>
        );
      
      default:
        return (
          <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-lg">
            {getStatusLabel(exam.status)}
          </span>
        );
    }
  };

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
      case 'ongoing': return 'Berlangsung';
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
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeWithTimezone(dateString);
  };

  // Count exams by status
  const examCounts = {
    available: getSortedExams().filter(exam => exam.status === 'ready').length,
    ongoing: getSortedExams().filter(exam => exam.status === 'ongoing').length,
    completed: getSortedExams().filter(exam => exam.status === 'completed').length
  };

  const sortedExams = getSortedExams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">Daftar Ujian</h1>
                <p className="text-blue-100 mt-1">Kelola dan ikuti ujian yang tersedia untuk Anda</p>
              </div>
            </div>
          </div>
        </div>

      {/* Exam Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Exams */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ujian Tersedia</h3>
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-600 mb-2">{examCounts.available}</p>
              <p className="text-gray-600 text-sm">Ujian siap dikerjakan</p>
            </div>
          </div>

        {/* Ongoing Exams */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sedang Berlangsung</h3>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-orange-600 mb-2">{examCounts.ongoing}</p>
              <p className="text-gray-600 text-sm">Ujian aktif</p>
            </div>
          </div>

        {/* Completed Exams */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Selesai</h3>
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-blue-600 mb-2">{examCounts.completed}</p>
              <p className="text-gray-600 text-sm">Ujian telah selesai</p>
            </div>
          </div>
        </div>

      {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
              </div>
          
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Academic Period Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Periode Akademik
                </label>
                <select
                  value={filters.academic_period_id}
                  onChange={(e) => handleFilterChange('academic_period_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="ready">Siap</option>
                  <option value="ongoing">Berlangsung</option>
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
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari judul ujian..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Exam List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Daftar Ujian</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {totalItems} ujian ditemukan
                </span>
                {totalItems > 0 && (
                  <span className="text-xs text-gray-400">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                )}
              </div>
            </div>
          </div>
        
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Memuat ujian...</p>
                <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
              </div>
            </div>
          ) : sortedExams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="student-exam-table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Ujian</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('duration_minutes')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Durasi</span>
                        {renderSortIcon('duration_minutes')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('availability_start_time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Jadwal</span>
                        {renderSortIcon('availability_start_time')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedExams.map((exam, index) => (
                    <tr key={exam._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 max-w-xs">
                        <div>
                          <div className="student-exam-cell-content text-sm font-medium text-gray-900" title={exam.title}>
                              {exam.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                            <span>ID: {exam._id.slice(-8)}</span>
                            {exam.teaching_assignment_details?.subject_details && (
                              <>
                                <span>•</span>
                                <span>{exam.teaching_assignment_details.subject_details.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getExamTypeLabel(exam.exam_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{exam.duration_minutes}</span>
                          <span className="text-gray-500 ml-1">menit</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="font-medium">Mulai:</span>
                            <span className="ml-1">{formatDateTime(exam.availability_start_time)}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="font-medium">Selesai:</span>
                            <span className="ml-1">{formatDateTime(exam.availability_end_time)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                          {getStatusLabel(exam.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {renderActionButton(exam)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Ujian</h4>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                Tidak ada ujian yang sesuai dengan filter yang dipilih. Coba ubah kriteria pencarian Anda.
              </p>
              <button 
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filter
              </button>
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && sortedExams.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{((currentPage - 1) * (filters.limit || 10)) + 1}</span> sampai{' '}
                    <span className="font-medium">{Math.min(currentPage * (filters.limit || 10), totalItems)}</span> dari{' '}
                    <span className="font-medium">{totalItems}</span> ujian
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  
                  {/* Page numbers with improved logic */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleFilterChange('page', pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border rounded-lg focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handleFilterChange('page', currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExamsPage;
import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Filter, 
  Search, 
  RotateCcw, 
  Table, 
  BookOpen,
  Eye,
  Edit,
  Trash2,
  User,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import { questionSubmissionService, QuestionSubmission, QuestionSubmissionFilters, AcademicPeriod } from '@/services/questionSubmission';
import { teacherService, TeachingClass } from '@/services/teacher';
import QuestionDisplay from '@/components/QuestionDisplay';
import Pagination from '@/components/Pagination';
import TeacherQuestionFormModal from './modals/TeacherQuestionFormModal';
import TeacherQuestionDeleteModal from './modals/TeacherQuestionDeleteModal';
import TeacherQuestionDetailModal from './modals/TeacherQuestionDetailModal';
import TeacherSubmissionDetailModal from './modals/TeacherSubmissionDetailModal';
import TeacherSubmissionApproveModal from './modals/TeacherSubmissionApproveModal';
import TeacherSubmissionRejectModal from './modals/TeacherSubmissionRejectModal';
import toast from 'react-hot-toast';

interface QuestionFilters {
  search?: string;
  difficulty?: string;
  question_type?: string;
  purpose?: string;
  include_submitted?: boolean;
  include_approved?: boolean;
  page: number;
  limit: number;
}

type QuestionSource = 'my_questions' | 'submitted_questions';

const TeacherQuestionsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  
  // View state - 'table' or 'exam'
  const [currentView, setCurrentView] = useState<'table' | 'exam'>('table');
  
  // Question source state - 'my_questions' or 'submitted_questions'
  const [questionSource, setQuestionSource] = useState<QuestionSource>('my_questions');
  
  // Filter state
  const [filters, setFilters] = useState<QuestionFilters & QuestionSubmissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    difficulty: '',
    question_type: '',
    purpose: '',
    academic_period_id: '',
    status: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showSubmissionDetailModal, setShowSubmissionDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<QuestionSubmission | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [submissionToApprove, setSubmissionToApprove] = useState<QuestionSubmission | null>(null);
  const [submissionToReject, setSubmissionToReject] = useState<QuestionSubmission | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filters, questionSource]);

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      const teachingData = await teacherService.getTeachingSummary(token);
      setTeachingClasses(teachingData.classes);
      
      // Fetch academic periods
      const periods = await questionSubmissionService.getAcademicPeriods(token);
      setAcademicPeriods(periods);
      
      // Get active academic period
      const activePeriod = await questionSubmissionService.getActiveAcademicPeriod(token);
      setActiveAcademicPeriod(activePeriod);
      
      // Set default academic period filter to active period
      if (activePeriod) {
        setFilters(prev => ({
          ...prev,
          academic_period_id: activePeriod._id
        }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data awal');
    }
  };

  const fetchQuestions = async () => {
    if (!token) return;

    setLoading(true);
    try {
      if (questionSource === 'my_questions') {
        const allQuestions = await questionBankService.getMyQuestions(token);
        
        // Apply filters
        let filteredQuestions = allQuestions;
        
        if (filters.search) {
          filteredQuestions = filteredQuestions.filter(q => 
            q.question_text.toLowerCase().includes(filters.search!.toLowerCase()) ||
            q.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
          );
        }
        
        if (filters.difficulty) {
          filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
        }
        
        if (filters.question_type) {
          filteredQuestions = filteredQuestions.filter(q => q.question_type === filters.question_type);
        }

        // Apply pagination
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
      
        setQuestions(paginatedQuestions);
        setSubmissions([]);
        setTotalItems(filteredQuestions.length);
      } else {
        // Fetch submitted questions for review
        try {
          const submissionFilters: QuestionSubmissionFilters = {
            academic_period_id: filters.academic_period_id,
            search: filters.search,
            purpose: filters.purpose,
            question_type: filters.question_type,
            difficulty: filters.difficulty,
            status: filters.status
          };
          
          const allSubmissions = await questionSubmissionService.getSubmissionsForReview(token, submissionFilters);
          
          // Apply pagination
          const startIndex = (filters.page - 1) * filters.limit;
          const endIndex = startIndex + filters.limit;
          const paginatedSubmissions = allSubmissions.slice(startIndex, endIndex);

          setSubmissions(paginatedSubmissions);
          setQuestions([]);
          setTotalItems(allSubmissions.length);
        } catch (error: any) {
          if (error.message.includes('403') || error.message.includes('Forbidden')) {
            toast.error('Anda bukan koordinator mata pelajaran');
            setSubmissions([]);
            setQuestions([]);
            setTotalItems(0);
          } else {
            throw error;
          }
        }
      }

      setCurrentPage(filters.page);

    } catch (error) {
      console.error('Error fetching data:', error);
      if (!error.message?.includes('403')) {
        toast.error('Gagal memuat daftar soal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QuestionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleResetFilters = () => {
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      difficulty: '',
      question_type: '',
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewChange = (view: 'table' | 'exam') => {
    setCurrentView(view);
  };

  const handleQuestionSourceChange = (source: QuestionSource) => {
    setQuestionSource(source);
    // Reset filters when changing source
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setFilters(prev => ({
      ...prev,
      page: 1,
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    }));
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setShowCreateModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowEditModal(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  const handleViewSubmission = (submission: QuestionSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetailModal(true);
  };

  const handleApproveSubmission = (submission: QuestionSubmission) => {
    setSubmissionToApprove(submission);
    setShowApproveModal(true);
  };

  const handleRejectSubmission = (submission: QuestionSubmission) => {
    setSubmissionToReject(submission);
    setShowRejectModal(true);
  };

  const handleApprovalSuccess = () => {
    fetchQuestions();
    setShowApproveModal(false);
    setShowRejectModal(false);
  };

  const handleModalSuccess = () => {
    if (questionSource === 'my_questions') {
      fetchQuestions();
    } else {
      fetchQuestions(); // This will fetch submissions
    }
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setShowSubmissionDetailModal(false);
    setSelectedQuestion(null);
    setSelectedSubmission(null);
    setSubmissionToApprove(null);
    setSubmissionToReject(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Pilihan Ganda';
      case 'essay': return 'Essay';
      default: return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Disubmit' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Disetujui' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Ditolak' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
    }
  };

  const totalPages = Math.ceil(totalItems / filters.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
              <p className="text-gray-600">Kelola dan tinjau soal pembelajaran</p>
            </div>
          </div>
          
          <button
            onClick={handleCreateQuestion}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Question Source Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sumber Soal</h3>
        </div>
        
        <div className="flex rounded-lg bg-gray-100 p-1 max-w-md">
          <button
            onClick={() => handleQuestionSourceChange('my_questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              questionSource === 'my_questions' 
                ? 'bg-yellow-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Soal Saya</span>
          </button>
          <button
            onClick={() => handleQuestionSourceChange('submitted_questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center ${
              questionSource === 'submitted_questions' 
                ? 'bg-yellow-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Soal Disubmit</span>
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          {questionSource === 'my_questions' 
            ? 'Menampilkan soal yang Anda buat'
            : 'Menampilkan soal yang disubmit oleh guru lain untuk direview'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Soal</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari soal atau tag..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
            />
          </div>

          {/* Question Type Filter */}
          <select
            value={filters.question_type}
            onChange={(e) => handleFilterChange('question_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
          >
            <option value="">Semua Tipe Soal</option>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="essay">Essay</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
          >
            <option value="">Semua Tingkat</option>
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </select>

          {/* Additional filters for submitted questions */}
          {questionSource === 'submitted_questions' && (
            <>
              {/* Academic Period Filter */}
              <select
                value={filters.academic_period_id}
                onChange={(e) => handleFilterChange('academic_period_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
              >
                <option value="">Semua Periode</option>
                {academicPeriods.map((period) => (
                  <option key={period._id} value={period._id}>
                    {period.year} - {period.semester} {period.status === 'active' ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>

              {/* Purpose Filter */}
              <input
                type="text"
                placeholder="Tujuan..."
                value={filters.purpose}
                onChange={(e) => handleFilterChange('purpose', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
              />

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
              >
                <option value="">Semua Status</option>
                <option value="submitted">Disubmit</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </>
          )}

          {/* Reset Button */}
          {questionSource === 'my_questions' && <button
            onClick={handleResetFilters}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>}
        </div>
        
        {/* Active Filters Display */}
        {(filters.search || filters.difficulty || filters.question_type || 
          (questionSource === 'submitted_questions' && (filters.purpose || filters.academic_period_id || filters.status))) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">Filter aktif:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Pencarian: "{filters.search}"
                  </span>
                )}
                {filters.difficulty && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Tingkat: {getDifficultyLabel(filters.difficulty)}
                  </span>
                )}
                {filters.question_type && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Tipe: {getTypeLabel(filters.question_type)}
                  </span>
                )}
                {questionSource === 'submitted_questions' && filters.purpose && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Tujuan: "{filters.purpose}"
                  </span>
                )}
                {questionSource === 'submitted_questions' && filters.academic_period_id && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Periode: {academicPeriods.find(p => p._id === filters.academic_period_id)?.year} - {academicPeriods.find(p => p._id === filters.academic_period_id)?.semester}
                  </span>
                )}
                {questionSource === 'submitted_questions' && filters.status && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Status: {filters.status === 'submitted' ? 'Disubmit' : filters.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </span>
                )}
                {questionSource === 'submitted_questions' && filters.status && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                    Disetujui
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle & Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* View Toggle */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {totalItems} {questionSource === 'my_questions' ? 'soal' : 'submission'} ditemukan {questionSource === 'submitted_questions' ? '(dari guru lain)' : '(soal Anda)'}
            </div>
            
            {/* Toggle Buttons */}
            <div className="flex rounded-lg bg-white border border-gray-200 p-1">
              <button
                onClick={() => handleViewChange('table')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentView === 'table' 
                    ? 'bg-yellow-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Tabel</span>
              </button>
              <button
                onClick={() => handleViewChange('exam')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentView === 'exam' 
                    ? 'bg-yellow-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Ujian</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
                <span className="text-gray-600">Memuat data...</span>
              </div>
            </div>
          ) : (questionSource === 'my_questions' ? questions.length === 0 : submissions.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.difficulty || filters.question_type || 
                 (questionSource === 'submitted_questions' && (filters.purpose || filters.academic_period_id || filters.status))
                  ? `Tidak ada ${questionSource === 'my_questions' ? 'soal' : 'submission'} yang sesuai filter` 
                  : questionSource === 'my_questions' ? 'Belum ada soal' : 'Belum ada submission'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.difficulty || filters.question_type ||
                 (questionSource === 'submitted_questions' && (filters.purpose || filters.academic_period_id || filters.status))
                  ? `Coba ubah atau reset filter untuk melihat ${questionSource === 'my_questions' ? 'soal' : 'submission'} lainnya`
                  : questionSource === 'my_questions' 
                    ? 'Mulai dengan membuat soal pertama Anda'
                    : 'Belum ada soal yang disubmit untuk direview'
                }
              </p>
              {!(filters.search || filters.difficulty || filters.question_type ||
                 (questionSource === 'submitted_questions' && (filters.purpose || filters.academic_period_id || filters.status))) && 
               questionSource === 'my_questions' && (
                <button
                  onClick={handleCreateQuestion}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Soal Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`transition-all duration-300 ${currentView === 'exam' ? 'animate-fade-in' : ''}`}>
              {currentView === 'table' ? (
                questionSource === 'my_questions' ? (
                  /* My Questions Table View */
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Soal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kesulitan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Poin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {questions.map((question, index) => (
                          <tr key={question._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {question._id.slice(-8)}
                                </div>
                                {question.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {question.tags.slice(0, 2).map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {question.tags.length > 2 && (
                                      <span className="text-xs text-gray-500">
                                        +{question.tags.length - 2} lagi
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getTypeLabel(question.question_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                {getDifficultyLabel(question.difficulty)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {question.points}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                question.status === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {question.status === 'public' ? 'Publik' : 'Pribadi'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleViewQuestion(question)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditQuestion(question)}
                                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                                  title="Edit Soal"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  title="Hapus Soal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Submitted Questions Table View */
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Soal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kesulitan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Poin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tujuan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission, index) => {
                          const statusInfo = getStatusBadge(submission.status);
                          const StatusIcon = statusInfo.icon;
                          
                          return (
                            <tr key={submission._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="max-w-xs">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text.substring(0, 100) + (submission.question_details.question_text.length > 100 ? '...' : '') }} />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: {submission.question_details._id.slice(-8)}
                                  </div>
                                  {submission.question_details.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {submission.question_details.tags.slice(0, 2).map((tag, tagIndex) => (
                                        <span
                                          key={tagIndex}
                                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {submission.question_details.tags.length > 2 && (
                                        <span className="text-xs text-gray-500">
                                          +{submission.question_details.tags.length - 2} lagi
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getTypeLabel(submission.question_details.question_type)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(submission.question_details.difficulty)}`}>
                                  {getDifficultyLabel(submission.question_details.difficulty)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission.question_details.points}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {submission.purpose}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {submission.status === 'submitted' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveSubmission(submission)}
                                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                                        title="Setujui Soal"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectSubmission(submission)}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                        title="Tolak Soal"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleViewSubmission(submission)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Exam View */
                <div className="space-y-4 sm:space-y-6">
                  {questionSource === 'my_questions' ? (
                    <QuestionDisplay
                      questions={questions}
                      mode="view"
                      showActions={true}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      onView={handleViewQuestion}
                      className="space-y-6"
                    />
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {submissions.map((submission) => {
                        const statusInfo = getStatusBadge(submission.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <div key={submission._id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {getTypeLabel(submission.question_details.question_type)}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(submission.question_details.difficulty)}`}>
                                    {getDifficultyLabel(submission.question_details.difficulty)}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {submission.question_details.points} poin
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <div className="prose prose-sm max-w-none mb-3 text-sm sm:text-base">
                                  <div dangerouslySetInnerHTML={{ __html: submission.question_details.question_text }} />
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                  <span className="font-medium">Tujuan:</span> {submission.purpose}
                                </div>
                                
                                {submission.question_details.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {submission.question_details.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                                {submission.status === 'submitted' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveSubmission(submission)}
                                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span className="hidden sm:inline">Setujui</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectSubmission(submission)}
                                      className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                      <span className="hidden sm:inline">Tolak</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleViewSubmission(submission)}
                                  className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden sm:inline">Detail</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={filters.limit}
              itemName="soal"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <TeacherQuestionFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
          teachingClasses={teachingClasses}
          currentUserId={user?._id || ''}
        />
      )}

      {showEditModal && selectedQuestion && (
        <TeacherQuestionFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleModalSuccess}
          teachingClasses={teachingClasses}
          currentUserId={user?._id || ''}
          question={selectedQuestion}
        />
      )}

      {showDeleteModal && selectedQuestion && (
        <TeacherQuestionDeleteModal
          question={selectedQuestion}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showDetailModal && selectedQuestion && (
        <TeacherQuestionDetailModal
          question={selectedQuestion}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          teachingClasses={teachingClasses}
        />
      )}
      {showSubmissionDetailModal && selectedSubmission && (
        <TeacherSubmissionDetailModal
          submission={selectedSubmission}
          isOpen={showSubmissionDetailModal}
          onClose={() => setShowSubmissionDetailModal(false)}
        />
      )}

      {showApproveModal && submissionToApprove && (
        <TeacherSubmissionApproveModal
          submission={submissionToApprove}
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onSuccess={handleApprovalSuccess}
        />
      )}

      {showRejectModal && submissionToReject && (
        <TeacherSubmissionRejectModal
          submission={submissionToReject}
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
};

export default TeacherQuestionsPage;
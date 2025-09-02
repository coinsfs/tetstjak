import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import { questionSubmissionService, QuestionSubmission, QuestionSubmissionFilters, AcademicPeriod } from '@/services/questionSubmission';
import { teacherService, TeachingClass } from '@/services/teacher';
import useDebounce from '@/hooks/useDebounce';
import QuestionDisplay from '@/components/QuestionDisplay';
import Pagination from '@/components/Pagination';
import QuestionSourceToggle from './components/QuestionSourceToggle';
import QuestionFiltersComponent from './components/QuestionFilters';
import QuestionViewToggle from './components/QuestionViewToggle';
import MyQuestionsTable from './components/MyQuestionsTable';
import MySubmissionsTable from './components/MySubmissionsTable';
import MySubmissionsExamView from './components/MySubmissionsExamView';
import TeacherQuestionFormModal from './modals/TeacherQuestionFormModal';
import TeacherQuestionDeleteModal from './modals/TeacherQuestionDeleteModal';
import TeacherQuestionDetailModal from './modals/TeacherQuestionDetailModal';
import TeacherSubmissionDetailModal from './modals/TeacherSubmissionDetailModal';
import TeacherSubmitQuestionsModal from './modals/TeacherSubmitQuestionsModal';
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

type QuestionSource = 'my_questions' | 'my_submissions';

// Memoized child components to prevent unnecessary re-renders
const MemoizedQuestionSourceToggle = memo(QuestionSourceToggle);
const MemoizedQuestionFiltersComponent = memo(QuestionFiltersComponent);
const MemoizedQuestionViewToggle = memo(QuestionViewToggle);
const MemoizedMyQuestionsTable = memo(MyQuestionsTable);
const MemoizedMySubmissionsTable = memo(MySubmissionsTable);
const MemoizedQuestionDisplay = memo(QuestionDisplay);
const MemoizedMySubmissionsExamView = memo(MySubmissionsExamView);
const MemoizedPagination = memo(Pagination);

const TeacherQuestionsPage: React.FC = () => {
  const { token, user } = useAuth();
  
  // Separate loading states for better UX
  const [initialLoading, setInitialLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  
  // Data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mySubmissions, setMySubmissions] = useState<QuestionSubmission[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  
  // UI states
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'table' | 'exam'>('table');
  const [questionSource, setQuestionSource] = useState<QuestionSource>('my_questions');
  
  // Optimized filter state with debouncing
  const [internalFilters, setInternalFilters] = useState<QuestionFilters & QuestionSubmissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    difficulty: '',
    question_type: '',
    purpose: '',
    academic_period_id: '',
    status: ''
  });
  
  // Debounce search to prevent excessive API calls
  const debouncedSearch = useDebounce(internalFilters.search, 500);
  
  // Memoized filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    ...internalFilters,
    search: debouncedSearch
  }), [internalFilters, debouncedSearch]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showSubmissionDetailModal, setShowSubmissionDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<QuestionSubmission | null>(null);
  const [showSubmitQuestionsModal, setShowSubmitQuestionsModal] = useState(false);

  // Memoized initial data fetcher to prevent unnecessary API calls
  const fetchInitialData = useCallback(async () => {
    if (!token) return;

    try {
      setInitialLoading(true);
      const [teachingData, periods, activePeriod] = await Promise.all([
        teacherService.getTeachingSummary(token),
        questionSubmissionService.getAcademicPeriods(token),
        questionSubmissionService.getActiveAcademicPeriod(token)
      ]);
      
      setTeachingClasses(teachingData.classes);
      setAcademicPeriods(periods);
      setActiveAcademicPeriod(activePeriod);
      
      // Set default academic period filter only once
      if (activePeriod && !internalFilters.academic_period_id) {
        setInternalFilters(prev => ({
          ...prev,
          academic_period_id: activePeriod._id
        }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data awal');
    } finally {
      setInitialLoading(false);
    }
  }, [token, internalFilters.academic_period_id]);

  // Optimized questions fetcher with proper error handling
  const fetchQuestions = useCallback(async () => {
    if (!token || initialLoading) return;

    setQuestionsLoading(true);
    try {
      if (questionSource === 'my_questions') {
        const allQuestions = await questionBankService.getMyQuestions(token);
        
        // Apply filters efficiently
        let filteredQuestions = allQuestions;
        
        // Use memoized filter functions
        if (filters.search?.trim()) {
          const searchTerm = filters.search.toLowerCase();
          filteredQuestions = filteredQuestions.filter(q => 
            q.question_text.toLowerCase().includes(searchTerm) ||
            q.tags.some(tag => tag.toLowerCase().includes(searchTerm))
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
        setMySubmissions([]);
        setTotalItems(filteredQuestions.length);
      } else if (questionSource === 'my_submissions') {
        const submissionFilters: QuestionSubmissionFilters = {
          academic_period_id: filters.academic_period_id || undefined,
          search: filters.search || undefined,
          purpose: filters.purpose || undefined,
          question_type: filters.question_type || undefined,
          difficulty: filters.difficulty || undefined,
          status: filters.status || undefined
        };
        
        const allMySubmissions = await questionSubmissionService.getMySubmissions(token, submissionFilters);
        
        // Apply pagination
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        const paginatedMySubmissions = allMySubmissions.slice(startIndex, endIndex);

        setMySubmissions(paginatedMySubmissions);
        setQuestions([]);
        setTotalItems(allMySubmissions.length);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (!error.message?.includes('403')) {
        toast.error(`Gagal memuat ${questionSource === 'my_questions' ? 'soal' : 'submission'}`);
      }
      // Set empty states on error
      setQuestions([]);
      setMySubmissions([]);
      setTotalItems(0);
    } finally {
      setQuestionsLoading(false);
    }
  }, [token, filters, questionSource, initialLoading]);

  // Initial data fetch - only once
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Questions fetch - only when necessary dependencies change
  useEffect(() => {
    if (!initialLoading) {
      fetchQuestions();
    }
  }, [fetchQuestions, initialLoading]);

  // Memoized filter handlers to prevent child re-renders
  const handleFilterChange = useCallback((key: keyof QuestionFilters, value: any) => {
    setInternalFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to first page unless changing page
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setInternalFilters({
      page: 1,
      limit: 10,
      search: '',
      difficulty: '',
      question_type: '',
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    });
    setSelectedQuestions([]);
  }, [activeAcademicPeriod]);

  const handlePageChange = useCallback((page: number) => {
    setInternalFilters(prev => ({ ...prev, page }));
  }, []);

  const handleItemsPerPageChange = useCallback((newLimit: number) => {
    setInternalFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
  }, []);

  // Memoized view handlers
  const handleViewChange = useCallback((view: 'table' | 'exam') => {
    setCurrentView(view);
  }, []);

  const handleQuestionSourceChange = useCallback((source: QuestionSource) => {
    setQuestionSource(source);
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setSelectedQuestions([]);
    setShowSubmitQuestionsModal(false);
    setInternalFilters(prev => ({
      ...prev,
      page: 1,
      search: '',
      difficulty: '',
      question_type: '',
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    }));
  }, [activeAcademicPeriod]);

  // Memoized question selection handlers
  const handleQuestionSelect = useCallback((questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const handleSelectAllQuestions = useCallback((selectAll: boolean) => {
    setSelectedQuestions(selectAll ? questions.map(q => q._id) : []);
  }, [questions]);

  // Memoized modal handlers
  const handleSubmitQuestions = useCallback(() => {
    if (questionSource !== 'my_questions') return;
    setShowSubmitQuestionsModal(true);
  }, [questionSource]);

  const handleCreateQuestion = useCallback(() => {
    setSelectedQuestion(null);
    setShowCreateModal(true);
  }, []);

  const handleEditQuestion = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setShowEditModal(true);
  }, []);

  const handleDeleteQuestion = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  }, []);

  const handleViewQuestion = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  }, []);

  const handleViewSubmission = useCallback((submission: QuestionSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetailModal(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    fetchQuestions();
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setShowSubmissionDetailModal(false);
    setShowSubmitQuestionsModal(false);
    setSelectedQuestion(null);
    setSelectedSubmission(null);
  }, [fetchQuestions]);

  // Memoized computed values
  const totalPages = useMemo(() => Math.ceil(totalItems / filters.limit), [totalItems, filters.limit]);
  const shouldShowSubmitButton = useMemo(() => 
    questionSource === 'my_questions' && selectedQuestions.length > 0, 
    [questionSource, selectedQuestions.length]
  );
  
  const hasActiveFilters = useMemo(() => 
    filters.search || filters.difficulty || filters.question_type || 
    (questionSource === 'my_submissions' && (filters.purpose || filters.academic_period_id || filters.status)),
    [filters, questionSource]
  );
  
  const isEmpty = useMemo(() => 
    questionSource === 'my_questions' ? questions.length === 0 : mySubmissions.length === 0,
    [questionSource, questions.length, mySubmissions.length]
  );

  // Show initial loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-600 border-t-transparent"></div>
          <span className="text-gray-600">Memuat halaman bank soal...</span>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateQuestion}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Soal Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submit Questions Button */}
      {shouldShowSubmitButton && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedQuestions.length} soal dipilih
              </h3>
              <p className="text-sm text-gray-600">
                Submit soal yang dipilih untuk direview oleh koordinator
              </p>
            </div>
            <button
              onClick={handleSubmitQuestions}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Submit Soal</span>
            </button>
          </div>
        </div>
      )}

      {/* Question Source Toggle */}
      <MemoizedQuestionSourceToggle
        questionSource={questionSource}
        onSourceChange={handleQuestionSourceChange}
      />

      {/* Filters */}
      <MemoizedQuestionFiltersComponent
        filters={filters}
        questionSource={questionSource}
        academicPeriods={academicPeriods}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* View Toggle & Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* View Toggle */}
        <MemoizedQuestionViewToggle
          currentView={currentView}
          onViewChange={handleViewChange}
          totalItems={totalItems}
          questionSource={questionSource}
        />

        {/* Content Area */}
        <div>
          {questionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
                <span className="text-gray-600">Memuat data...</span>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters
                  ? `Tidak ada ${questionSource === 'my_questions' ? 'soal' : 'submission'} yang sesuai filter` 
                  : questionSource === 'my_questions' ? 'Belum ada soal' : 'Belum ada submission Anda'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? `Coba ubah atau reset filter untuk melihat ${questionSource === 'my_questions' ? 'soal' : 'submission'} lainnya`
                  : questionSource === 'my_questions' 
                    ? 'Mulai dengan membuat soal pertama Anda'
                    : 'Anda belum pernah submit soal ke koordinator'
                }
              </p>
              {!hasActiveFilters && questionSource === 'my_questions' && (
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
                  <MemoizedMyQuestionsTable
                    questions={questions}
                    showCheckbox={true}
                    selectedQuestions={selectedQuestions}
                    onQuestionSelect={handleQuestionSelect}
                    onSelectAll={handleSelectAllQuestions}
                    showSelectAll={true}
                    onView={handleViewQuestion}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ) : (
                  <MemoizedMySubmissionsTable
                    submissions={mySubmissions}
                    onView={handleViewSubmission}
                  />
                )
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {questionSource === 'my_questions' ? (
                    <MemoizedQuestionDisplay
                      questions={questions}
                      showCheckbox={true}
                      selectedQuestions={selectedQuestions}
                      onQuestionSelect={handleQuestionSelect}
                      onSelectAll={handleSelectAllQuestions}
                      showSelectAll={true}
                      mode="view"
                      showActions={true}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      onView={handleViewQuestion}
                      className="space-y-6"
                    />
                  ) : (
                    <MemoizedMySubmissionsExamView
                      submissions={mySubmissions}
                      onView={handleViewSubmission}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {(totalItems > 0 || totalPages > 1) && (
          <div className="py-4 px-2 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6">
            <MemoizedPagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalRecords={totalItems}
              recordsPerPage={filters.limit}
              onLimitChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>

      {/* Modals - Only render when needed */}
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

      {showSubmitQuestionsModal && (
        <TeacherSubmitQuestionsModal
          isOpen={showSubmitQuestionsModal}
          onClose={() => setShowSubmitQuestionsModal(false)}
          onSuccess={handleModalSuccess}
          selectedQuestionIds={selectedQuestions}
          questionSource={questionSource}
        />
      )}
    </div>
  );
};

export default TeacherQuestionsPage;
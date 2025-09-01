import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import { questionSubmissionService, QuestionSubmission, QuestionSubmissionFilters, AcademicPeriod } from '@/services/questionSubmission';
import { teacherService, TeachingClass } from '@/services/teacher';
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

const TeacherQuestionsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mySubmissions, setMySubmissions] = useState<QuestionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  
  // Selection state for creating question sets
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
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
    academic_period_id: undefined, // Initialize as undefined to prevent premature fetching
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
  const [showSubmitQuestionsModal, setShowSubmitQuestionsModal] = useState(false);

  // Combined data fetching logic to prevent double requests
  useEffect(() => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Track current state values to avoid unnecessary re-fetching
      let currentActivePeriod = activeAcademicPeriod;
      let currentAcademicPeriods = academicPeriods;
      let currentTeachingClasses = teachingClasses;
      let initialFiltersApplied = false;

      // Fetch initial data if not already fetched
      if (currentTeachingClasses.length === 0) {
        const teachingData = await teacherService.getTeachingSummary(token);
        currentTeachingClasses = teachingData.classes;
        setTeachingClasses(currentTeachingClasses);
      }

      if (currentAcademicPeriods.length === 0) {
        const periods = await questionSubmissionService.getAcademicPeriods(token);
        currentAcademicPeriods = periods;
        setAcademicPeriods(currentAcademicPeriods);
      }

      if (!currentActivePeriod) {
        currentActivePeriod = await questionSubmissionService.getActiveAcademicPeriod(token);
        setActiveAcademicPeriod(currentActivePeriod);
      }

      // Initialize academic_period_id filter if it's undefined
      if (filters.academic_period_id === undefined) {
        const defaultAcademicPeriodId = currentActivePeriod?._id || '';
        setFilters(prev => ({
          ...prev,
          academic_period_id: defaultAcademicPeriodId
        }));
        initialFiltersApplied = true;
      }

      // If initial filters were just applied, this useEffect will re-run
      // We should only proceed with fetching if filters are properly initialized
      if (filters.academic_period_id === undefined && !initialFiltersApplied) {
        setLoading(false);
        return;
      }

      // Proceed with fetching questions/submissions
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
        setMySubmissions([]);
        setTotalItems(filteredQuestions.length);
      } else if (questionSource === 'my_submissions') {
        // Fetch my submissions
        try {
          const submissionFilters: QuestionSubmissionFilters = {
            academic_period_id: filters.academic_period_id,
            search: filters.search,
            purpose: filters.purpose,
            question_type: filters.question_type,
            difficulty: filters.difficulty,
            status: filters.status
          };
          
          const allMySubmissions = await questionSubmissionService.getMySubmissions(token, submissionFilters);
          
          // Apply pagination
          const startIndex = (filters.page - 1) * filters.limit;
          const endIndex = startIndex + filters.limit;
          const paginatedMySubmissions = allMySubmissions.slice(startIndex, endIndex);

          setMySubmissions(paginatedMySubmissions);
          setQuestions([]);
          setTotalItems(allMySubmissions.length);
        } catch (error: any) {
          console.error('Error fetching my submissions:', error);
          toast.error('Gagal memuat submission Anda');
          setMySubmissions([]);
          setQuestions([]);
          setTotalItems(0);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!error.message?.includes('403')) {
        toast.error('Gagal memuat daftar soal');
      }
    } finally {
      setLoading(false);
    }
  }, [
    token,
    filters.page,
    filters.limit,
    filters.search,
    filters.difficulty,
    filters.question_type,
    filters.purpose,
    filters.academic_period_id, // This will trigger re-fetch once properly set
    filters.status,
    questionSource,
    // Note: We don't include teachingClasses, academicPeriods, activeAcademicPeriod
    // as dependencies to avoid unnecessary re-fetching
  ]);

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

  const handleItemsPerPageChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when limit changes
    }));
  };

  const handleViewChange = (view: 'table' | 'exam') => {
    setCurrentView(view);
  };

  const handleQuestionSourceChange = (source: QuestionSource) => {
    setQuestionSource(source);
    // Reset filters when changing source
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    // Reset selections when changing source
    setSelectedQuestions([]);
    setShowSubmitQuestionsModal(false);
    setFilters(prev => ({
      ...prev,
      page: 1,
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    }));
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAllQuestions = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedQuestions(questions.map(q => q._id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSubmitQuestions = () => {
    // Only allow submit for my_questions
    if (questionSource !== 'my_questions') {
      return;
    }
    setShowSubmitQuestionsModal(true);
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

  const handleModalSuccess = () => {
    // No need to manually call fetchQuestions - the useEffect will handle re-fetching
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setShowSubmissionDetailModal(false);
    setShowSubmitQuestionsModal(false);
    setSelectedQuestion(null);
    setSelectedSubmission(null);
  };

  const totalPages = Math.ceil(totalItems / filters.limit);

  // Determine if submit button should be shown
  const shouldShowSubmitButton = questionSource === 'my_questions' && selectedQuestions.length > 0;

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

      {/* Original Header - now simplified */}
      <div className="bg-white rounded-xl shadow-sm p-6" style={{ display: 'none' }}>
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
      <QuestionSourceToggle
        questionSource={questionSource}
        onSourceChange={handleQuestionSourceChange}
      />

      {/* Filters */}
      <QuestionFiltersComponent
        filters={filters}
        questionSource={questionSource}
        academicPeriods={academicPeriods}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* View Toggle & Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* View Toggle */}
        <QuestionViewToggle
          currentView={currentView}
          onViewChange={handleViewChange}
          totalItems={totalItems}
          questionSource={questionSource}
        />

        {/* Content Area (Table/Exam View, Loading, Empty State) */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
                <span className="text-gray-600">Memuat data...</span>
              </div>
            </div>
          ) : (questionSource === 'my_questions' ? questions.length === 0 : 
                 mySubmissions.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.difficulty || filters.question_type || 
                 (questionSource === 'my_submissions' && (filters.purpose || filters.academic_period_id || filters.status))
                  ? `Tidak ada ${questionSource === 'my_questions' ? 'soal' : 'submission'} yang sesuai filter` 
                  : questionSource === 'my_questions' ? 'Belum ada soal' : 'Belum ada submission Anda'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.difficulty || filters.question_type ||
                 (questionSource === 'my_submissions' && (filters.purpose || filters.academic_period_id || filters.status))
                  ? `Coba ubah atau reset filter untuk melihat ${questionSource === 'my_questions' ? 'soal' : 'submission'} lainnya`
                  : questionSource === 'my_questions' 
                    ? 'Mulai dengan membuat soal pertama Anda'
                    : 'Anda belum pernah submit soal ke koordinator'
                }
              </p>
              {!(filters.search || filters.difficulty || filters.question_type ||
                 (questionSource === 'my_submissions' && (filters.purpose || filters.academic_period_id || filters.status))) && 
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
                  <MyQuestionsTable
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
                    /* My Submissions Table View */
                    <MySubmissionsTable
                      submissions={mySubmissions}
                      onView={handleViewSubmission}
                    />
                )
              ) : (
                /* Exam View */
                <div className="space-y-4 sm:space-y-6">
                  {questionSource === 'my_questions' ? (
                    <QuestionDisplay
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
                    <MySubmissionsExamView
                      submissions={mySubmissions}
                      onView={handleViewSubmission}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination - Always visible within this container */}
        {(totalItems > 0 || totalPages > 1) && (
          <div className="py-4 px-2 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6">
            <Pagination
              currentPage={filters.page} // Use filters.page directly
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalRecords={totalItems}
              recordsPerPage={filters.limit}
              onLimitChange={handleItemsPerPageChange}
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
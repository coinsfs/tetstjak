import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
} from 'lucide-react';
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
import SubmittedQuestionsTable from './components/SubmittedQuestionsTable';
import SubmittedQuestionsExamView from './components/SubmittedQuestionsExamView';
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
                  <MyQuestionsTable
                    questions={questions}
                    onView={handleViewQuestion}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ) : (
                  /* Submitted Questions Table View */
                  <SubmittedQuestionsTable
                    submissions={submissions}
                    onView={handleViewSubmission}
                    onApprove={handleApproveSubmission}
                    onReject={handleRejectSubmission}
                  />
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
                    <SubmittedQuestionsExamView
                      submissions={submissions}
                      onView={handleViewSubmission}
                      onApprove={handleApproveSubmission}
                      onReject={handleRejectSubmission}
                    />
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
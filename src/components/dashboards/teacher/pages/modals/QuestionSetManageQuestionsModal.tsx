import React, { useState, useEffect } from 'react';
import { X, Package, User, Send, Search, Plus, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionSetService, QuestionSet } from '@/services/questionSet';
import { questionBankService, Question } from '@/services/questionBank';
import { questionSubmissionService, QuestionSubmission, QuestionSubmissionFilters, AcademicPeriod } from '@/services/questionSubmission';
import QuestionDisplay from '@/components/QuestionDisplay';
import Pagination from '@/components/Pagination';
import MyQuestionsTable from '../components/MyQuestionsTable';
import SubmittedQuestionsTable from '../components/SubmittedQuestionsTable';
import SubmittedQuestionsExamView from '../components/SubmittedQuestionsExamView';
import QuestionFiltersComponent from '../components/QuestionFilters';
import QuestionViewToggle from '../components/QuestionViewToggle';
import toast from 'react-hot-toast';

interface QuestionSetManageQuestionsModalProps {
  questionSet: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type QuestionSource = 'my_questions' | 'submitted_questions';

interface QuestionFilters {
  search?: string;
  difficulty?: string;
  question_type?: string;
  purpose?: string;
  page: number;
  limit: number;
}

const QuestionSetManageQuestionsModal: React.FC<QuestionSetManageQuestionsModalProps> = ({
  questionSet,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<QuestionSource>('my_questions');
  const [currentView, setCurrentView] = useState<'table' | 'exam'>('table');
  
  // Questions data
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [submittedQuestions, setSubmittedQuestions] = useState<QuestionSubmission[]>([]);
  const [myQuestionsTotalItems, setMyQuestionsTotalItems] = useState(0);
  const [submittedQuestionsTotalItems, setSubmittedQuestionsTotalItems] = useState(0);
  const [loadingMyQuestions, setLoadingMyQuestions] = useState(false);
  const [loadingSubmittedQuestions, setLoadingSubmittedQuestions] = useState(false);
  
  // Current question set questions
  const [currentQuestionIds, setCurrentQuestionIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  
  // Academic periods for submitted questions
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [activeAcademicPeriod, setActiveAcademicPeriod] = useState<AcademicPeriod | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<QuestionFilters & QuestionSubmissionFilters>({
    page: 1,
    limit: 10, // Optimal number for modal display
    search: '',
    difficulty: '',
    question_type: '',
    purpose: '',
    academic_period_id: '',
    status: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'my_questions') {
        fetchMyQuestions();
      } else {
        fetchSubmittedQuestions();
      }
    }
  }, [isOpen, activeTab, filters]);

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      // Fetch detailed question set to get current question IDs
      const detailedQuestionSet = await questionSetService.getQuestionSetDetails(token, questionSet._id);
      setCurrentQuestionIds(detailedQuestionSet.question_ids || []);
      
      // Fetch academic periods for submitted questions
      const periods = await questionSubmissionService.getAcademicPeriods(token);
      setAcademicPeriods(periods);
      
      // Get active academic period
      const activePeriod = await questionSubmissionService.getActiveAcademicPeriod(token);
      setActiveAcademicPeriod(activePeriod);
      
      // Set default academic period filter
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

  const fetchMyQuestions = async () => {
    if (!token) return;

    setLoadingMyQuestions(true);
    try {
      // Create pagination filters for my questions
      const myQuestionFilters = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        difficulty: filters.difficulty,
        question_type: filters.question_type
      };

      const response = await questionBankService.getMyQuestions(token, myQuestionFilters);
      setMyQuestions(response.data || response); // Handle both paginated and non-paginated responses
      setMyQuestionsTotalItems(response.total_items || (Array.isArray(response) ? response.length : 0));
    } catch (error) {
      console.error('Error fetching my questions:', error);
      toast.error('Gagal memuat soal Anda');
    } finally {
      setLoadingMyQuestions(false);
    }
  };

  const fetchSubmittedQuestions = async () => {
    if (!token) return;

    setLoadingSubmittedQuestions(true);
    try {
      const submissionFilters: QuestionSubmissionFilters = {
        page: filters.page,
        limit: filters.limit,
        academic_period_id: filters.academic_period_id,
        search: filters.search,
        purpose: filters.purpose,
        question_type: filters.question_type,
        difficulty: filters.difficulty,
        status: filters.status
      };
      
      const response = await questionSubmissionService.getSubmissionsForReview(token, submissionFilters);
      setSubmittedQuestions(response.data || response); // Handle both paginated and non-paginated responses
      setSubmittedQuestionsTotalItems(response.total_items || (Array.isArray(response) ? response.length : 0));
    } catch (error) {
      console.error('Error fetching submitted questions:', error);
      toast.error('Gagal memuat soal yang disubmit');
    } finally {
      setLoadingSubmittedQuestions(false);
    }
  };

  const handleFilterChange = (key: keyof QuestionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' && key !== 'limit' ? 1 : prev.page // Reset to page 1 when filtering, except for page/limit changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when limit changes
    }));
  };

  const handleResetFilters = () => {
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      difficulty: '',
      question_type: '',
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    });
  };

  const handleTabChange = (tab: QuestionSource) => {
    setActiveTab(tab);
    setSelectedQuestionIds([]);
    // Reset filters but keep the same page structure
    const defaultAcademicPeriodId = activeAcademicPeriod?._id || '';
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      difficulty: '',
      question_type: '',
      purpose: '',
      academic_period_id: defaultAcademicPeriodId,
      status: ''
    });
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAllQuestions = (selectAll: boolean) => {
    if (activeTab === 'my_questions') {
      if (selectAll) {
        // Only select questions on current page
        const currentPageQuestionIds = myQuestions.map(q => q._id);
        setSelectedQuestionIds(prev => [...new Set([...prev, ...currentPageQuestionIds])]);
      } else {
        // Only deselect questions on current page
        const currentPageQuestionIds = myQuestions.map(q => q._id);
        setSelectedQuestionIds(prev => prev.filter(id => !currentPageQuestionIds.includes(id)));
      }
    } else {
      if (selectAll) {
        // Only select submissions on current page
        const currentPageQuestionIds = submittedQuestions.map(s => s.question_id);
        setSelectedQuestionIds(prev => [...new Set([...prev, ...currentPageQuestionIds])]);
      } else {
        // Only deselect submissions on current page
        const currentPageQuestionIds = submittedQuestions.map(s => s.question_id);
        setSelectedQuestionIds(prev => prev.filter(id => !currentPageQuestionIds.includes(id)));
      }
    }
  };

  const handleAddQuestions = async () => {
    if (!token || selectedQuestionIds.length === 0) {
      toast.error('Pilih minimal satu soal');
      return;
    }

    setLoading(true);
    try {
      // Use new API endpoint to add questions
      await questionSetService.addQuestionsToSet(token, questionSet._id, selectedQuestionIds);
      
      // Update local state
      const updatedQuestionIds = [...new Set([...currentQuestionIds, ...selectedQuestionIds])];
      setCurrentQuestionIds(updatedQuestionIds);
      setSelectedQuestionIds([]);
      toast.success(`Berhasil menambahkan ${selectedQuestionIds.length} soal ke paket`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan soal';
      toast.error(errorMessage);
      console.error('Error adding questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      // Use new API endpoint to remove questions
      await questionSetService.removeQuestionsFromSet(token, questionSet._id, [questionId]);
      
      // Update local state
      const updatedQuestionIds = currentQuestionIds.filter(id => id !== questionId);
      setCurrentQuestionIds(updatedQuestionIds);
      toast.success('Soal berhasil dihapus dari paket');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus soal';
      toast.error(errorMessage);
      console.error('Error removing question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const isQuestionInSet = (questionId: string) => currentQuestionIds.includes(questionId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Kelola Soal Paket</h2>
              <p className="text-sm text-gray-500">{questionSet.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Current Questions Summary */}
        <div className="p-6 bg-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-900">Soal Saat Ini</h3>
                <p className="text-sm text-purple-700">
                  {currentQuestionIds.length} soal dalam paket ini
                </p>
              </div>
            </div>
            {selectedQuestionIds.length > 0 && (
              <button
                onClick={handleAddQuestions}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan {selectedQuestionIds.length} Soal</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('my_questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my_questions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Soal Saya</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('submitted_questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'submitted_questions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Soal untuk Review</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <QuestionFiltersComponent
            filters={filters}
            questionSource={activeTab}
            academicPeriods={academicPeriods}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Content */}
        <div className="bg-white">
          {/* View Toggle */}
          <QuestionViewToggle
            currentView={currentView}
            onViewChange={setCurrentView}
            totalItems={activeTab === 'my_questions' ? myQuestionsTotalItems : submittedQuestionsTotalItems}
            questionSource={activeTab}
          />

          {/* Questions List */}
          <div className="p-6">
            {activeTab === 'my_questions' ? (
              loadingMyQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-gray-600">Memuat soal...</span>
                  </div>
                </div>
              ) : myQuestionsTotalItems === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada soal yang sesuai filter
                  </h3>
                  <p className="text-gray-600">
                    Coba ubah filter untuk melihat soal lainnya
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentView === 'table' ? (
                    <MyQuestionsTable
                      questions={myQuestions}
                      showCheckbox={true}
                      selectedQuestions={selectedQuestionIds}
                      onQuestionSelect={handleQuestionSelect}
                      onSelectAll={handleSelectAllQuestions}
                      showSelectAll={true}
                      onView={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ) : (
                    <QuestionDisplay
                      questions={myQuestions}
                      mode="view"
                      showCheckbox={true}
                      selectedQuestions={selectedQuestionIds}
                      onQuestionSelect={handleQuestionSelect}
                      onSelectAll={handleSelectAllQuestions}
                      showSelectAll={true}
                      className="space-y-6"
                    />
                  )}
                  
                  {/* Pagination for My Questions */}
                  {myQuestionsTotalItems > filters.limit && (
                    <div className="border-t border-gray-200 pt-4">
                      <Pagination
                        currentPage={filters.page}
                        totalPages={Math.ceil(myQuestionsTotalItems / filters.limit)}
                        onPageChange={handlePageChange}
                        totalRecords={myQuestionsTotalItems}
                        recordsPerPage={filters.limit}
                        onLimitChange={handleItemsPerPageChange}
                      />
                    </div>
                  )}
                  
                  {/* Show which questions are already in the set */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Soal yang sudah ada dalam paket ({currentQuestionIds.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {myQuestions
                        .filter(q => isQuestionInSet(q._id))
                        .map((question) => (
                          <div
                            key={question._id}
                            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                          >
                            <span className="truncate max-w-xs">
                              {question.question_text.replace(/<[^>]*>/g, '').substring(0, 50)}...
                            </span>
                            <button
                              onClick={() => handleRemoveQuestion(question._id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Hapus dari paket"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              loadingSubmittedQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-gray-600">Memuat soal...</span>
                  </div>
                </div>
              ) : submittedQuestionsTotalItems === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada soal untuk review
                  </h3>
                  <p className="text-gray-600">
                    Belum ada soal yang disubmit untuk review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentView === 'table' ? (
                    <SubmittedQuestionsTable
                      submissions={submittedQuestions}
                      showCheckbox={true}
                      selectedSubmissions={selectedQuestionIds}
                      onSubmissionSelect={(submissionId) => {
                        const submission = submittedQuestions.find(s => s._id === submissionId);
                        if (submission) {
                          handleQuestionSelect(submission.question_id);
                        }
                      }}
                      onSelectAll={handleSelectAllQuestions}
                      showSelectAll={true}
                      onView={() => {}}
                      onApprove={() => {}}
                      onReject={() => {}}
                    />
                  ) : (
                    <SubmittedQuestionsExamView
                      submissions={submittedQuestions}
                      showCheckbox={true}
                      selectedSubmissions={selectedQuestionIds}
                      onSubmissionSelect={(submissionId) => {
                        const submission = submittedQuestions.find(s => s._id === submissionId);
                        if (submission) {
                          handleQuestionSelect(submission.question_id);
                        }
                      }}
                      onSelectAll={handleSelectAllQuestions}
                      showSelectAll={true}
                      onView={() => {}}
                      onApprove={() => {}}
                      onReject={() => {}}
                    />
                  )}
                  
                  {/* Pagination for Submitted Questions */}
                  {submittedQuestionsTotalItems > filters.limit && (
                    <div className="border-t border-gray-200 pt-4">
                      <Pagination
                        currentPage={filters.page}
                        totalPages={Math.ceil(submittedQuestionsTotalItems / filters.limit)}
                        onPageChange={handlePageChange}
                        totalRecords={submittedQuestionsTotalItems}
                        recordsPerPage={filters.limit}
                        onLimitChange={handleItemsPerPageChange}
                      />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="text-sm text-gray-600">
            {selectedQuestionIds.length > 0 ? (
              <span>{selectedQuestionIds.length} soal dipilih untuk ditambahkan</span>
            ) : (
              <span>
                Menampilkan {Math.min(filters.limit, activeTab === 'my_questions' ? myQuestionsTotalItems : submittedQuestionsTotalItems)} 
                dari {activeTab === 'my_questions' ? myQuestionsTotalItems : submittedQuestionsTotalItems} soal
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Tutup
            </button>
            
            <button
              onClick={handleSaveChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetManageQuestionsModal;
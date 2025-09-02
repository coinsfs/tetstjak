import React, { useState, useEffect } from 'react';
import { X, HelpCircle, BookOpen, Plus, Trash2, Search, Package, User, CheckCircle, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherExam } from '@/services/teacherExam';
import { TeachingClass } from '@/services/teacher';
import { questionBankService, Question } from '@/services/questionBank';
import { questionSetService, QuestionSet, QuestionSetFilters, QuestionSetResponse } from '@/services/questionSet';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';

interface TeacherExamQuestionsModalProps {
  exam: TeacherExam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachingClasses: TeachingClass[];
}

const TeacherExamQuestionsModal: React.FC<TeacherExamQuestionsModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSuccess,
  teachingClasses
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_questions' | 'question_sets'>('my_questions');
  
  // My Questions Tab
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loadingMyQuestions, setLoadingMyQuestions] = useState(false);
  const [searchMyQuestions, setSearchMyQuestions] = useState('');
  const [myQuestionsCurrentPage, setMyQuestionsCurrentPage] = useState(1);
  const [myQuestionsLimit, setMyQuestionsLimit] = useState(10);
  const [myQuestionsTotalItems, setMyQuestionsTotalItems] = useState(0);
  
  // Question Sets Tab
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [questionSetsResponse, setQuestionSetsResponse] = useState<QuestionSetResponse | null>(null);
  const [questionSetFilters, setQuestionSetFilters] = useState<QuestionSetFilters>({
    page: 1,
    limit: 6,
    subject_id: '',
    grade_level: '',
    status: '',
    search: ''
  });
  
  // Selected questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [currentExamQuestions, setCurrentExamQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentExamQuestions(exam.question_ids || []);
      setSelectedQuestionIds([]);
      
      // Reset pagination states
      setMyQuestionsCurrentPage(1);
      setMyQuestionsTotalItems(0);
      
      // Set default filters based on exam details
      if (exam.teaching_assignment_details) {
        setQuestionSetFilters(prev => ({
          ...prev,
          subject_id: exam.teaching_assignment_details.subject_id,
          grade_level: exam.teaching_assignment_details.class_details.grade_level.toString()
        }));
      }
      
      if (activeTab === 'my_questions') {
        fetchMyQuestions();
      } else {
        fetchQuestionSets();
      }
    }
  }, [isOpen, activeTab]);

  // Effect for My Questions pagination
  useEffect(() => {
    if (activeTab === 'my_questions') {
      fetchMyQuestions();
    }
  }, [myQuestionsCurrentPage, myQuestionsLimit, searchMyQuestions]);

  useEffect(() => {
    if (activeTab === 'question_sets') {
      fetchQuestionSets();
    }
  }, [questionSetFilters]);

  const fetchMyQuestions = async () => {
    if (!token) return;

    setLoadingMyQuestions(true);
    try {
      const filters = {
        page: myQuestionsCurrentPage,
        limit: myQuestionsLimit,
        search: searchMyQuestions.trim() || undefined
      };
      
      const response = await questionBankService.getMyQuestions(token, filters);
      
      // Handle both paginated response and legacy array response
      if (response && typeof response === 'object' && 'data' in response) {
        // New paginated response
        setMyQuestions(response.data || []);
        setMyQuestionsTotalItems(response.total_items || 0);
      } else if (Array.isArray(response)) {
        // Legacy array response - apply client-side filtering and pagination
        const filteredQuestions = response.filter(question =>
          searchMyQuestions.trim() === '' ||
          question.question_text.toLowerCase().includes(searchMyQuestions.toLowerCase()) ||
          question.tags.some(tag => tag.toLowerCase().includes(searchMyQuestions.toLowerCase()))
        );
        
        const startIndex = (myQuestionsCurrentPage - 1) * myQuestionsLimit;
        const endIndex = startIndex + myQuestionsLimit;
        const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
        
        setMyQuestions(paginatedQuestions);
        setMyQuestionsTotalItems(filteredQuestions.length);
      } else {
        // Fallback
        setMyQuestions([]);
        setMyQuestionsTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching my questions:', error);
      toast.error('Gagal memuat soal Anda');
      setMyQuestions([]);
      setMyQuestionsTotalItems(0);
    } finally {
      setLoadingMyQuestions(false);
    }
  };

  const fetchQuestionSets = async () => {
    if (!token) return;

    setLoadingQuestionSets(true);
    try {
      const response = await questionSetService.getQuestionSets(token, questionSetFilters);
      setQuestionSets(response.data);
      setQuestionSetsResponse(response);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      toast.error('Gagal memuat paket soal');
    } finally {
      setLoadingQuestionSets(false);
    }
  };

  const handleMyQuestionsPageChange = useCallback((page: number) => {
    setMyQuestionsCurrentPage(page);
  }, []);

  const handleMyQuestionsLimitChange = useCallback((newLimit: number) => {
    setMyQuestionsLimit(newLimit);
    setMyQuestionsCurrentPage(1); // Reset to first page when limit changes
  }, []);

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleQuestionSetSelect = async (questionSet: QuestionSet) => {
    if (!token) return;

    try {
      setLoading(true);
      const questionSetQuestions = await questionSetService.getQuestionSetQuestions(token, questionSet._id);
      setSelectedQuestionIds(questionSetQuestions.question_ids);
      toast.success(`Dipilih ${questionSetQuestions.question_ids.length} soal dari paket "${questionSet.name}"`);
    } catch (error) {
      console.error('Error fetching question set questions:', error);
      toast.error('Gagal memuat soal dari paket');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!token || selectedQuestionIds.length === 0) {
      toast.error('Pilih minimal satu soal');
      return;
    }

    setLoading(true);
    try {
      // Send all selected questions (current + new selections)
      const allQuestionIds = [...new Set([...currentExamQuestions, ...selectedQuestionIds])];
      
      await questionBankService.updateExamQuestions(token, exam._id, allQuestionIds);
      toast.success(`Berhasil menambahkan ${selectedQuestionIds.length} soal ke ujian`);
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan soal';
      toast.error(errorMessage);
      console.error('Error saving questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      // Remove question from current list and update exam
      const updatedQuestions = currentExamQuestions.filter(id => id !== questionId);
      await questionBankService.updateExamQuestions(token, exam._id, updatedQuestions);
      setCurrentExamQuestions(updatedQuestions);
      toast.success('Soal berhasil dihapus dari ujian');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus soal';
      toast.error(errorMessage);
      console.error('Error removing question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QuestionSetFilters, value: any) => {
    setQuestionSetFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setQuestionSetFilters(prev => ({ ...prev, page }));
  };

  // Handle search with debouncing for My Questions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'my_questions') {
        setMyQuestionsCurrentPage(1); // Reset to first page when searching
        fetchMyQuestions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchMyQuestions, activeTab]);

  const myQuestionsTotalPages = Math.ceil(myQuestionsTotalItems / myQuestionsLimit);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Dipublikasi';
      case 'draft': return 'Draft';
      case 'archived': return 'Diarsipkan';
      default: return status;
    }
  };

  const getGradeLabel = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Input Soal Ujian</h2>
              <p className="text-sm text-gray-500">{exam.title}</p>
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
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Soal Saat Ini</h3>
                <p className="text-sm text-blue-700">
                  {currentExamQuestions.length} soal telah ditambahkan ke ujian
                </p>
              </div>
            </div>
            {selectedQuestionIds.length > 0 && (
              <div className="text-sm text-blue-700">
                +{selectedQuestionIds.length} soal akan ditambahkan
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my_questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my_questions'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Soal Saya</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('question_sets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'question_sets'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Paket Soal</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'my_questions' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari soal berdasarkan teks atau tag..."
                  value={searchMyQuestions}
                  onChange={(e) => setSearchMyQuestions(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadingMyQuestions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
                      <span className="text-gray-600">Memuat soal...</span>
                    </div>
                  </div>
                ) : myQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchMyQuestions ? 'Tidak ada soal yang cocok' : 'Belum ada soal'}
                    </h3>
                    <p className="text-gray-600">
                      {searchMyQuestions 
                        ? 'Coba ubah kata kunci pencarian'
                        : 'Anda belum membuat soal apapun'
                      }
                    </p>
                  </div>
                ) : (
                  myQuestions.map((question) => (
                    <div
                      key={question._id}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedQuestionIds.includes(question._id)
                          ? 'border-yellow-500 bg-yellow-50'
                          : currentExamQuestions.includes(question._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (!currentExamQuestions.includes(question._id)) {
                          handleQuestionToggle(question._id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.points} poin
                            </span>
                            {currentExamQuestions.includes(question._id) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sudah ditambahkan
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                            {question.question_text}
                          </p>
                          {question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {question.tags.map((tag, index) => (
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
                        <div className="flex items-center space-x-2 ml-4">
                          {currentExamQuestions.includes(question._id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveQuestion(question._id);
                              }}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus dari ujian"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.includes(question._id)}
                              onChange={() => handleQuestionToggle(question._id)}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination for My Questions */}
              {myQuestionsTotalPages > 1 && (
                <div className="flex items-center justify-center py-8">
                  <Pagination
                    currentPage={myQuestionsCurrentPage}
                    totalPages={myQuestionsTotalPages}
                    onPageChange={handleMyQuestionsPageChange}
                    totalRecords={myQuestionsTotalItems}
                    recordsPerPage={myQuestionsLimit}
                    onLimitChange={handleMyQuestionsLimitChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Filter Paket Soal</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pencarian
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari paket soal..."
                        value={questionSetFilters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tingkat Kelas
                    </label>
                    <select
                      value={questionSetFilters.grade_level || ''}
                      onChange={(e) => handleFilterChange('grade_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                    >
                      <option value="">Semua Kelas</option>
                      <option value="10">Kelas X</option>
                      <option value="11">Kelas XI</option>
                      <option value="12">Kelas XII</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={questionSetFilters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                    >
                      <option value="">Semua Status</option>
                      <option value="published">Dipublikasi</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Diarsipkan</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibilitas
                    </label>
                    <select
                      value={questionSetFilters.is_public !== undefined ? questionSetFilters.is_public.toString() : ''}
                      onChange={(e) => handleFilterChange('is_public', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
                    >
                      <option value="">Semua</option>
                      <option value="true">Publik</option>
                      <option value="false">Pribadi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Sets Grid */}
              {loadingQuestionSets ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
                    <span className="text-gray-600">Memuat paket soal...</span>
                  </div>
                </div>
              ) : questionSets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada paket soal ditemukan
                  </h3>
                  <p className="text-gray-600">
                    Coba ubah filter atau kata kunci pencarian
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {questionSets.map((questionSet) => (
                    <div
                      key={questionSet._id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleQuestionSetSelect(questionSet)}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">
                              {questionSet.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {questionSet.description}
                            </p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(questionSet.status)}`}>
                              {getStatusLabel(questionSet.status)}
                            </span>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600">Kelas {getGradeLabel(questionSet.grade_level)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">{questionSet.metadata.total_questions} soal</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-gray-600">{questionSet.metadata.total_points} poin</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-600">{questionSet.subject.name}</span>
                          </div>
                        </div>

                        {/* Difficulty Distribution */}
                        {questionSet.metadata.total_questions > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">Distribusi Kesulitan:</div>
                            <div className="flex space-x-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              {questionSet.metadata.difficulty_distribution.easy > 0 && (
                                <div 
                                  className="bg-green-400"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.easy / questionSet.metadata.total_questions) * 100}%` 
                                  }}
                                  title={`${questionSet.metadata.difficulty_distribution.easy} soal mudah`}
                                />
                              )}
                              {questionSet.metadata.difficulty_distribution.medium > 0 && (
                                <div 
                                  className="bg-yellow-400"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.medium / questionSet.metadata.total_questions) * 100}%` 
                                  }}
                                  title={`${questionSet.metadata.difficulty_distribution.medium} soal sedang`}
                                />
                              )}
                              {questionSet.metadata.difficulty_distribution.hard > 0 && (
                                <div 
                                  className="bg-red-400"
                                  style={{ 
                                    width: `${(questionSet.metadata.difficulty_distribution.hard / questionSet.metadata.total_questions) * 100}%` 
                                  }}
                                  title={`${questionSet.metadata.difficulty_distribution.hard} soal sulit`}
                                />
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Mudah: {questionSet.metadata.difficulty_distribution.easy}</span>
                              <span>Sedang: {questionSet.metadata.difficulty_distribution.medium}</span>
                              <span>Sulit: {questionSet.metadata.difficulty_distribution.hard}</span>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {questionSet.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {questionSet.metadata.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {questionSet.metadata.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                                +{questionSet.metadata.tags.length - 3} lagi
                              </span>
                            )}
                          </div>
                        )}

                        {/* Creator */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>Oleh: {questionSet.created_by.full_name}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-yellow-600 group-hover:text-yellow-700">
                            <Plus className="w-4 h-4" />
                            <span className="text-xs font-medium">Pilih Paket</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {questionSetsResponse && questionSetsResponse.total_pages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span>
                      Menampilkan {((questionSetsResponse.current_page - 1) * questionSetsResponse.limit) + 1} - {Math.min(questionSetsResponse.current_page * questionSetsResponse.limit, questionSetsResponse.total_items)} dari {questionSetsResponse.total_items} paket soal
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(questionSetsResponse.current_page - 1)}
                      disabled={questionSetsResponse.current_page <= 1}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, questionSetsResponse.total_pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              page === questionSetsResponse.current_page
                                ? 'bg-yellow-600 text-white'
                                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(questionSetsResponse.current_page + 1)}
                      disabled={questionSetsResponse.current_page >= questionSetsResponse.total_pages}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="text-sm text-gray-600">
            {activeTab === 'my_questions' ? (
              <>
                {myQuestionsTotalItems > 0 && (
                  <span>
                    Menampilkan {((myQuestionsCurrentPage - 1) * myQuestionsLimit) + 1} - {Math.min(myQuestionsCurrentPage * myQuestionsLimit, myQuestionsTotalItems)} dari {myQuestionsTotalItems} soal
                  </span>
                )}
                {selectedQuestionIds.length > 0 && (
                  <span className="ml-4 font-medium text-yellow-600">
                    {selectedQuestionIds.length} soal dipilih untuk ditambahkan
                  </span>
                )}
              </>
            ) : (
              selectedQuestionIds.length > 0 && (
                <span className="font-medium text-yellow-600">
                  {selectedQuestionIds.length} soal dipilih untuk ditambahkan
                </span>
              )
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            
            {selectedQuestionIds.length > 0 && (
              <button
                onClick={handleSaveQuestions}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Menyimpan...</span>
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
      </div>
    </div>
  );
};

export default TeacherExamQuestionsModal;
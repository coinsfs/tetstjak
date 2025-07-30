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
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { questionBankService, Question } from '@/services/questionBank';
import { teacherService, TeachingClass } from '@/services/teacher';
import QuestionDisplay from '@/components/QuestionDisplay';
import Pagination from '@/components/Pagination';
import TeacherQuestionFormModal from './modals/TeacherQuestionFormModal';
import TeacherQuestionDeleteModal from './modals/TeacherQuestionDeleteModal';
import TeacherQuestionDetailModal from './modals/TeacherQuestionDetailModal';
import toast from 'react-hot-toast';

interface QuestionFilters {
  search?: string;
  difficulty?: string;
  question_type?: string;
  page: number;
  limit: number;
}

const TeacherQuestionsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);
  
  // View state - 'table' or 'exam'
  const [currentView, setCurrentView] = useState<'table' | 'exam'>('table');
  
  // Filter state
  const [filters, setFilters] = useState<QuestionFilters>({
    page: 1,
    limit: 10,
    search: '',
    difficulty: '',
    question_type: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const fetchInitialData = async () => {
    if (!token) return;

    try {
      const teachingData = await teacherService.getTeachingSummary(token);
      setTeachingClasses(teachingData.classes);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data awal');
    }
  };

  const fetchQuestions = async () => {
    if (!token) return;

    setLoading(true);
    try {
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
      setTotalItems(filteredQuestions.length);
      setCurrentPage(filters.page);

    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Gagal memuat daftar soal');
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
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      difficulty: '',
      question_type: ''
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewChange = (view: 'table' | 'exam') => {
    setCurrentView(view);
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

  const handleModalSuccess = () => {
    fetchQuestions();
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setSelectedQuestion(null);
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Soal</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* View Toggle & Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* View Toggle */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {totalItems} soal ditemukan
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
                <span className="text-gray-600">Memuat soal...</span>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.difficulty || filters.question_type 
                  ? 'Tidak ada soal yang sesuai filter' 
                  : 'Belum ada soal'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.difficulty || filters.question_type
                  ? 'Coba ubah atau reset filter untuk melihat soal lainnya'
                  : 'Mulai dengan membuat soal pertama Anda'
                }
              </p>
              {!(filters.search || filters.difficulty || filters.question_type) && (
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
                /* Table View */
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
                                {question.question_text}
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
                /* Exam View */
                <div className="space-y-6">
                  <QuestionDisplay
                    questions={questions}
                    mode="view"
                    showActions={true}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                    onView={handleViewQuestion}
                    className="space-y-6"
                  />
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
    </div>
  );
};

export default TeacherQuestionsPage;
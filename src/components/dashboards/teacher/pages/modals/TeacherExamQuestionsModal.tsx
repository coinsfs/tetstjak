import React, { useState, useEffect } from 'react';
import { X, HelpCircle, BookOpen, Plus, Trash2, Search, Package, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherExam } from '@/services/teacherExam';
import { TeachingClass } from '@/services/teacher';
import { questionBankService, Question, QuestionSet } from '@/services/questionBank';
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
  
  // Question Sets Tab
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [searchQuestionSets, setSearchQuestionSets] = useState('');
  
  // Selected questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [currentExamQuestions, setCurrentExamQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentExamQuestions(exam.question_ids || []);
      setSelectedQuestionIds([]);
      if (activeTab === 'my_questions') {
        fetchMyQuestions();
      } else {
        fetchQuestionSets();
      }
    }
  }, [isOpen, activeTab]);

  const fetchMyQuestions = async () => {
    if (!token) return;

    setLoadingMyQuestions(true);
    try {
      const questions = await questionBankService.getMyQuestions(token);
      setMyQuestions(questions);
    } catch (error) {
      console.error('Error fetching my questions:', error);
      toast.error('Gagal memuat soal Anda');
    } finally {
      setLoadingMyQuestions(false);
    }
  };

  const fetchQuestionSets = async () => {
    if (!token) return;

    // Get teaching assignment details to find subject_id and grade_level
    const teachingAssignment = exam.teaching_assignment_details;
    if (!teachingAssignment) {
      toast.error('Data penugasan mengajar tidak ditemukan');
      return;
    }

    const subjectId = teachingAssignment.subject_id;
    const gradeLevel = teachingAssignment.class_details.grade_level;

    setLoadingQuestionSets(true);
    try {
      const questionSets = await questionBankService.getQuestionSets(token, subjectId, gradeLevel);
      setQuestionSets(questionSets);
    } catch (error) {
      console.error('Error fetching question sets:', error);
      toast.error('Gagal memuat paket soal');
    } finally {
      setLoadingQuestionSets(false);
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleQuestionSetSelect = (questionSet: QuestionSet) => {
    const questionIds = questionSet.questions.map(q => q._id);
    setSelectedQuestionIds(questionIds);
    toast.success(`Dipilih ${questionIds.length} soal dari paket "${questionSet.title}"`);
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

  const filteredMyQuestions = myQuestions.filter(question =>
    question.question_text.toLowerCase().includes(searchMyQuestions.toLowerCase()) ||
    question.tags.some(tag => tag.toLowerCase().includes(searchMyQuestions.toLowerCase()))
  );

  const filteredQuestionSets = questionSets.filter(questionSet =>
    questionSet.title.toLowerCase().includes(searchQuestionSets.toLowerCase()) ||
    questionSet.description.toLowerCase().includes(searchQuestionSets.toLowerCase())
  );

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
              {loadingMyQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
                    <span className="text-gray-600">Memuat soal...</span>
                  </div>
                </div>
              ) : filteredMyQuestions.length === 0 ? (
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredMyQuestions.map((question) => (
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
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari paket soal..."
                  value={searchQuestionSets}
                  onChange={(e) => setSearchQuestionSets(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Question Sets List */}
              {loadingQuestionSets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
                    <span className="text-gray-600">Memuat paket soal...</span>
                  </div>
                </div>
              ) : filteredQuestionSets.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuestionSets ? 'Tidak ada paket soal yang cocok' : 'Belum ada paket soal'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuestionSets 
                      ? 'Coba ubah kata kunci pencarian'
                      : 'Belum ada paket soal yang tersedia untuk mata pelajaran dan tingkat kelas ini'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredQuestionSets.map((questionSet) => (
                    <div
                      key={questionSet._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {questionSet.title}
                            </h4>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {questionSet.questions.length} soal
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {questionSet.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Dibuat oleh: {questionSet.created_by_details?.full_name || 'Koordinator'}</span>
                            <span>Total poin: {questionSet.questions.reduce((sum, q) => sum + q.points, 0)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuestionSetSelect(questionSet)}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Pilih Paket</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="text-sm text-gray-600">
            {selectedQuestionIds.length > 0 && (
              <span>{selectedQuestionIds.length} soal dipilih untuk ditambahkan</span>
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
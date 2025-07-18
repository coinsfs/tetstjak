import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Clock, User, Users, Settings, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Exam, Question } from '../../types/exam';
import { examService } from '../../services/examService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExamDetailModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
}

const ExamDetailModal: React.FC<ExamDetailModalProps> = ({
  exam,
  isOpen,
  onClose
}) => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!token || !exam.questions || exam.questions.length === 0) return;

      setLoadingQuestions(true);
      try {
        const questionsData = await examService.getQuestionsByIds(token, exam.questions);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Gagal memuat soal ujian');
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, token, exam.questions]);

  if (!isOpen) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExamTypeLabel = (examType: string) => {
    const typeLabels: { [key: string]: string } = {
      'official_uts': 'UTS (Ujian Tengah Semester)',
      'official_uas': 'UAS (Ujian Akhir Semester)',
      'quiz': 'Kuis',
      'daily_test': 'Ulangan Harian'
    };
    return typeLabels[examType] || examType;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      'pending_questions': { label: 'Menunggu Soal', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'ready': { label: 'Siap', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'active': { label: 'Aktif', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'completed': { label: 'Selesai', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      'cancelled': { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

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

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detail Ujian</h2>
              <p className="text-sm text-gray-500">Informasi lengkap ujian dan soal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informasi Ujian
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Judul Ujian</p>
                  <p className="font-medium text-gray-900 break-words">{exam.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Jenis Ujian</p>
                  <p className="font-medium text-gray-900">{getExamTypeLabel(exam.exam_type)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Durasi</p>
                    <p className="font-medium text-gray-900">{exam.duration_minutes} menit</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 break-words">
                      {exam.teaching_assignment_details.subject_details.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Jadwal & Target
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Waktu Mulai</p>
                    <p className="font-medium text-gray-900 break-words">
                      {formatDateTime(exam.availability_start_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Waktu Selesai</p>
                    <p className="font-medium text-gray-900 break-words">
                      {formatDateTime(exam.availability_end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Kelas Target</p>
                    <p className="font-medium text-gray-900 break-words">
                      Kelas {exam.teaching_assignment_details.class_details.grade_level} {exam.teaching_assignment_details.class_details.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Guru Pengampu</p>
                    <p className="font-medium text-gray-900">
                      {exam.teaching_assignment_details.teacher_details.login_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Pengawas</p>
                    <p className="font-medium text-gray-900">
                      {exam.proctor_ids.length > 0 ? `${exam.proctor_ids.length} pengawas` : 'Belum ada pengawas'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Pengaturan Ujian
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {exam.settings.shuffle_questions ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Acak Soal</p>
                  <p className="text-xs text-gray-500">
                    {exam.settings.shuffle_questions ? 'Diaktifkan' : 'Dinonaktifkan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {exam.settings.shuffle_options ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Acak Pilihan</p>
                  <p className="text-xs text-gray-500">
                    {exam.settings.shuffle_options ? 'Diaktifkan' : 'Dinonaktifkan'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {exam.settings.show_results_after_submission ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Tampilkan Hasil</p>
                  <p className="text-xs text-gray-500">
                    {exam.settings.show_results_after_submission ? 'Langsung' : 'Ditunda'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Soal Ujian
              </h3>
              {questions.length > 0 && (
                <div className="text-sm text-gray-500">
                  {questions.length} soal • Total {totalPoints} poin
                </div>
              )}
            </div>

            {loadingQuestions ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-700">Memuat soal...</span>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada soal</h4>
                <p className="text-gray-500">
                  Ujian ini belum memiliki soal atau soal belum ditambahkan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {index + 1}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {getDifficultyLabel(question.difficulty)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {question.points} poin
                        </span>
                      </div>
                      
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {question.question_text}
                      </p>
                    </div>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pilihan Jawaban:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={option.id} 
                              className={`flex items-center space-x-3 p-3 rounded-md border ${
                                option.is_correct 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                                option.is_correct 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="text-sm text-gray-900 break-words flex-1">
                                {option.text}
                              </span>
                              {option.is_correct && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.question_type === 'essay' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Soal Essay:</strong> Jawaban akan dinilai secara manual oleh guru.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailModal;
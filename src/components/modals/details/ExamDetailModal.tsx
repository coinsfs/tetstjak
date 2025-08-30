import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Clock, User, Users, Settings, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Exam, Question } from '@/types/exam';
import { examService } from '@/services/exam';
import { useAuth } from '@/contexts/AuthContext';
import QuestionDisplay from '@/components/QuestionDisplay';
import { formatDateTimeWithTimezone } from '@/utils/timezone';
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
    return formatDateTimeWithTimezone(dateString);
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
            ) : (
              <QuestionDisplay
                questions={questions}
                mode="view"
                className="max-h-96 overflow-y-auto"
              />
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

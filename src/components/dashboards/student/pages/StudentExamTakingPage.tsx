import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { examService } from '@/services/exam';
import { questionBankService, Question } from '@/services/questionBank';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Play, 
  CheckCircle,
  User,
  Calendar,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentExamTakingPageProps {
  user: UserProfile | null;
  sessionId: string;
}

interface ExamSession {
  _id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  settings: {
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_results_after_submission: boolean;
  };
  teaching_assignment_details?: {
    subject_details?: {
      name: string;
      code: string;
    };
    class_details?: {
      name: string;
      grade_level: number;
    };
  };
  question_ids: string[];
}

const StudentExamTakingPage: React.FC<StudentExamTakingPageProps> = ({ 
  user, 
  sessionId 
}) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);

  // Load exam session data
  useEffect(() => {
    const loadExamSession = async () => {
      if (!token || !sessionId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get exam session details from backend
        const examData = await examService.getExamById(token, sessionId);
        
        // Convert exam data to ExamSession format
        const examSession: ExamSession = {
          _id: examData._id,
          title: examData.title,
          exam_type: examData.exam_type,
          duration_minutes: examData.duration_minutes,
          availability_start_time: examData.availability_start_time,
          availability_end_time: examData.availability_end_time,
          status: examData.status,
          settings: examData.settings,
          teaching_assignment_details: examData.teaching_assignment_details,
          question_ids: examData.questions || []
        };
        
        setExamSession(examSession);
        setTimeRemaining(examSession.duration_minutes * 60); // Convert to seconds
        
        // Load questions if available
        if (examSession.question_ids && examSession.question_ids.length > 0) {
          setLoadingQuestions(true);
          try {
            const questionsData = await questionBankService.getQuestionsByIds(token, examSession.question_ids);
            setQuestions(questionsData);
          } catch (questionError) {
            console.error('Error loading questions:', questionError);
            toast.error('Gagal memuat soal ujian');
          } finally {
            setLoadingQuestions(false);
          }
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat sesi ujian';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error loading exam session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExamSession();
  }, [token, sessionId]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit exam
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  const handleStartExam = () => {
    setExamStarted(true);
    toast.success('Ujian dimulai! Selamat mengerjakan.');
  };

  const handleTimeUp = () => {
    toast.error('Waktu ujian telah habis! Jawaban akan otomatis dikumpulkan.');
    // TODO: Auto submit exam answers
    handleFinishExam();
  };

  const handleFinishExam = () => {
    toast.success('Ujian telah selesai dikerjakan.');
    // TODO: Submit exam answers to backend
    // Navigate back to exam list or results page
    navigate('/student/exams');
  };

  const handleBackToExams = () => {
    if (examStarted) {
      const confirmLeave = window.confirm(
        'Anda sedang mengerjakan ujian. Apakah Anda yakin ingin keluar? Jawaban yang belum disimpan akan hilang.'
      );
      if (!confirmLeave) return;
    }
    navigate('/student/exams');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'official_uts': return 'UTS';
      case 'official_uas': return 'UAS';
      case 'quiz': return 'Kuis';
      case 'daily_test': return 'Ulangan Harian';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {loadingQuestions ? 'Memuat soal ujian...' : 'Memuat sesi ujian...'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error || !examSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Gagal Memuat Ujian
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Sesi ujian tidak ditemukan atau tidak dapat diakses.'}
          </p>
          <button
            onClick={handleBackToExams}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={handleBackToExams}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </button>

            {/* Timer */}
            {examStarted && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                timeRemaining <= 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {user?.profile_details?.full_name || user?.login_id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!examStarted ? (
          /* Pre-Exam Information */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{examSession.title}</h1>
                  <p className="text-blue-100 mt-1">
                    {getExamTypeLabel(examSession.exam_type)} - Session ID: {sessionId.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Exam Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Mata Pelajaran</p>
                      <p className="font-medium text-gray-900">
                        {examSession.teaching_assignment_details?.subject_details?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Kelas</p>
                      <p className="font-medium text-gray-900">
                        {examSession.teaching_assignment_details?.class_details?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Durasi Ujian</p>
                      <p className="font-medium text-gray-900">
                        {examSession.duration_minutes} menit
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Jumlah Soal</p>
                      <p className="font-medium text-gray-900">
                        {questions.length > 0 ? questions.length : examSession.question_ids.length} soal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Petunjuk Ujian:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Pastikan koneksi internet Anda stabil selama ujian</li>
                  <li>• Jangan menutup atau refresh halaman browser selama ujian</li>
                  <li>• Waktu ujian akan berjalan otomatis setelah Anda memulai</li>
                  <li>• Jawaban akan otomatis tersimpan setiap kali Anda memilih/mengubah jawaban</li>
                  <li>• Ujian akan otomatis berakhir ketika waktu habis</li>
                  {examSession.settings.shuffle_questions && (
                    <li>• Urutan soal akan diacak untuk setiap siswa</li>
                  )}
                  {examSession.settings.shuffle_options && (
                    <li>• Urutan pilihan jawaban akan diacak</li>
                  )}
                </ul>
              </div>

              {/* Questions Status */}
              {loadingQuestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 font-medium">Memuat soal ujian...</p>
                  </div>
                </div>
              )}

              {questions.length === 0 && !loadingQuestions && examSession.question_ids.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">Soal ujian belum tersedia atau gagal dimuat.</p>
                </div>
              )}

              {questions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    ✓ {questions.length} soal berhasil dimuat dan siap dikerjakan
                  </p>
                </div>
              )}

              {/* Start Exam Button */}
              <div className="text-center">
                <button
                  onClick={handleStartExam}
                  disabled={loadingQuestions || (examSession.question_ids.length > 0 && questions.length === 0)}
                  className="inline-flex items-center px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memuat Soal...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Mulai Ujian
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Exam Taking Interface */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress Ujian</span>
                <span className="text-sm text-gray-500">0 / {questions.length} soal</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Question Area */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {questions.length > 0 ? (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Soal 1 dari {questions.length}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: questions[0]?.question_text || 'Memuat soal...' }}
                      />
                    </div>
                  </div>

                  {/* Answer Options (for multiple choice) */}
                  {questions[0]?.question_type === 'multiple_choice' && questions[0]?.options && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Pilih jawaban:</h4>
                      {questions[0].options.map((option, index) => (
                        <label key={option.id || index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="answer"
                            value={option.id || index}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div 
                            className="flex-1 text-sm text-gray-900"
                            dangerouslySetInnerHTML={{ __html: option.text }}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Essay Answer (for essay questions) */}
                  {questions[0]?.question_type === 'essay' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Jawaban:</h4>
                      <textarea
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tulis jawaban Anda di sini..."
                      />
                    </div>
                  )}

                  {/* Navigation and Submit */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      ← Soal Sebelumnya
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                        Soal Selanjutnya →
                      </button>
                      
                      <button
                        onClick={handleFinishExam}
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Selesai Ujian
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Soal Ujian Tidak Tersedia
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Soal ujian belum dimuat atau tidak tersedia.<br />
                    Silakan hubungi pengawas ujian jika masalah berlanjut.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamTakingPage;
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { studentExamService, ExamQuestion } from '@/services/studentExam';
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

const StudentExamTakingPage: React.FC<StudentExamTakingPageProps> = ({ 
  user, 
  sessionId 
}) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDuration, setExamDuration] = useState<number>(0);

  // Parse URL parameters for exam timing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
    const eParam = urlParams.get('e');
    const dParam = urlParams.get('d');

    if (sParam && eParam && dParam) {
      try {
        // Decode parameters
        const startTime = parseInt(atob(sParam + '=='));
        const endTime = parseInt(atob(eParam + '=='));
        const duration = parseInt(atob(dParam + '=='));
        
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeRemaining(timeLeft);
        setExamDuration(Math.floor(duration / 1000 / 60)); // Convert to minutes
        
        // Auto start if within exam time window
        if (now >= startTime && now <= endTime && timeLeft > 0) {
          setExamStarted(true);
        }
      } catch (error) {
        console.error('Error parsing URL parameters:', error);
        setError('Parameter ujian tidak valid');
      }
    } else {
      setError('Parameter ujian tidak ditemukan');
    }
  }, []);

  // Load exam questions
  useEffect(() => {
    const loadExamQuestions = async () => {
      if (!token || !sessionId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get exam questions using session ID
        const questionsData = await studentExamService.getExamQuestions(token, sessionId);
        setQuestions(questionsData);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat soal ujian';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error loading exam questions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExamQuestions();
  }, [token, sessionId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

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

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleTimeUp = () => {
    toast.error('Waktu ujian telah habis! Jawaban akan otomatis dikumpulkan.');
    // TODO: Auto submit exam answers
    handleFinishExam();
  };

  const handleFinishExam = () => {
    toast.success('Ujian telah selesai dikerjakan.');
    // TODO: Submit exam answers to backend
    // Navigate back to exam list using full page reload
    window.location.href = '/student/exams';
  };

  const handleBackToExams = () => {
    if (examStarted && timeRemaining > 0) {
      const confirmLeave = window.confirm(
        'Anda sedang mengerjakan ujian. Apakah Anda yakin ingin keluar? Jawaban yang belum disimpan akan hilang.'
      );
      if (!confirmLeave) return;
    }
    window.location.href = '/student/exams';
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

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            Memuat soal ujian...
          </p>
          <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error || (questions.length === 0 && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? 'Gagal Memuat Soal Ujian' : 'Soal Ujian Tidak Tersedia'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Soal ujian tidak ditemukan atau tidak dapat diakses.'}
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

  // Show waiting screen if exam hasn't started yet
  if (!examStarted && timeRemaining > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ujian Siap Dimulai
          </h2>
          <p className="text-gray-600 mb-6">
            Anda memiliki waktu <span className="font-semibold text-blue-600">{examDuration} menit</span> untuk menyelesaikan ujian ini.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Sisa waktu ujian:</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900 mt-2">
              {formatTime(timeRemaining)}
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setExamStarted(true)}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Mulai Ujian Sekarang
            </button>
            <button
              onClick={handleBackToExams}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Ujian
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show time up screen if time has expired
  if (timeRemaining <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Waktu Ujian Habis
          </h2>
          <p className="text-gray-600 mb-6">
            Waktu untuk mengerjakan ujian telah berakhir. Jawaban Anda akan otomatis dikumpulkan.
          </p>
          <button
            onClick={handleFinishExam}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Kumpulkan Jawaban
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
                {timeRemaining <= 300 && (
                  <span className="text-xs font-normal ml-2">
                    (Waktu hampir habis!)
                  </span>
                )}
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
        {/* Exam Taking Interface */}
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Progress Ujian</span>
                <span className="text-xs text-gray-500">
                  Durasi: {examDuration} menit
                </span>
              </div>
              <span className="text-sm text-gray-500">{answeredQuestions} / {totalQuestions} soal dijawab</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
              ></div>
            </div>
            {timeRemaining <= 600 && timeRemaining > 0 && (
              <div className="mt-2 text-xs text-orange-600 font-medium">
                ⚠️ Sisa waktu kurang dari 10 menit!
              </div>
            )}
          </div>

          {/* Question Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </h3>
              <div className="text-sm text-gray-500">
                {currentQuestion?.points} poin
              </div>
            </div>
            
            {/* Question Numbers Grid */}
            <div className="grid grid-cols-10 gap-2 mb-4">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[questions[index]?.id]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question Area */}
          {currentQuestion && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
                    />
                  </div>
                </div>

                {/* Answer Options (for multiple choice) */}
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Pilih jawaban:</h4>
                    {currentQuestion.options.map((option, index) => (
                      <label 
                        key={option.id} 
                        className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          answers[currentQuestion.id] === option.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.id}
                          checked={answers[currentQuestion.id] === option.id}
                          onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
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
                {currentQuestion.question_type === 'essay' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Jawaban:</h4>
                    <textarea
                      rows={6}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tulis jawaban Anda di sini..."
                    />
                  </div>
                )}

                {/* Navigation and Submit */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Soal Sebelumnya
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button 
                        onClick={handleNextQuestion}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Soal Selanjutnya →
                      </button>
                    ) : null}
                    
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExamTakingPage;
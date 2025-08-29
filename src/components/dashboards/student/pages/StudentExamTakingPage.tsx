import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { studentExamService, ExamQuestion } from '@/services/studentExam';
import { SecurityCheck, ExamMonitoring } from '@/components/security';
import { examSecurityService } from '@/services/examSecurity';
import { websocketService } from '@/services/websocket';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Play, 
  CheckCircle,
  User,
  Calendar,
  BookOpen,
  Save,
  Send,
  ChevronRight,
  Hash,
  Award,
  Wifi,
  WifiOff
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
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDuration, setExamDuration] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [securityPassed, setSecurityPassed] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [examStartTime, setExamStartTime] = useState<number>(0);

  // Track if initial data has been sent to proctor
  const [initialDataSent, setInitialDataSent] = useState(false);

  // WebSocket and activity tracking state
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting' | 'error'>('disconnected');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [actualExamId, setActualExamId] = useState<string>('');
  const questionStartTimeRef = useRef<Record<string, number>>({});
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save interval
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add logging for WebSocket messages in exam taking page
  useEffect(() => {
    // WebSocket message handling is now centralized in websocketService
  }, [securityPassed]);

  // Helper function to get localStorage key for exam answers
  const getExamAnswersKey = () => {
    return `exam_answers_${sessionId}_${user?._id}`;
  };

  // Parse URL parameters for exam timing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
    const eParam = urlParams.get('e');
    const dParam = urlParams.get('d');
    const examIdParam = urlParams.get('examId');

    if (sParam && eParam && dParam) {
      try {
        // Decode parameters
        const startTime = parseInt(atob(sParam + '=='));
        const endTime = parseInt(atob(eParam + '=='));
        const duration = parseInt(atob(dParam + '=='));
        
        // Decode exam ID if provided
        if (examIdParam) {
          try {
            const decodedExamId = atob(examIdParam.padEnd(examIdParam.length + (4 - examIdParam.length % 4) % 4, '='));

            setActualExamId(decodedExamId);
          } catch (error) {
            // Skip, gunakan sessionId
          }
        }
        
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeRemaining(timeLeft);
        setExamDuration(Math.floor(duration / 1000 / 60)); // Convert to minutes
        
        // Auto start if within exam time window
        if (now >= startTime && now <= endTime && timeLeft > 0) {
          setExamStarted(true);
        }
      } catch (error) {
        setError('Parameter ujian tidak valid');
      }
    } else {
      setError('Parameter ujian tidak ditemukan');
    }
  }, []);

  // Load answers from localStorage on mount
  useEffect(() => {
    if (!user?._id || !sessionId) return;

    try {
      const savedAnswers = localStorage.getItem(getExamAnswersKey());
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }, [user?._id, sessionId]);

  // WebSocket status monitoring (AuthContext manages the actual connection)
  useEffect(() => {
    if (!securityPassed) return;

    // Monitor WebSocket connection status
    const checkConnectionStatus = () => {
      const isConnected = websocketService.isConnected();
      const connectionState = websocketService.getConnectionState();
      setWsConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    // Check status immediately and then periodically
    checkConnectionStatus();
    const statusInterval = setInterval(checkConnectionStatus, 5000);

    // Listen for proctor messages
    websocketService.onMessage('proctor_message', (data) => {});

    return () => {
      clearInterval(statusInterval);
      websocketService.offMessage('proctor_message');
    };
  }, [securityPassed]);

  // Heartbeat for activity monitoring
  useEffect(() => {
    if (!examStarted || !user?._id || !securityPassed) return;

    heartbeatIntervalRef.current = setInterval(() => {
      // Send simple heartbeat - no complex data needed
      websocketService.send({
        type: 'student_heartbeat',
        student_id: user._id,
        exam_id: sessionId,
        session_id: sessionId,
        timestamp: Date.now()
      });
    }, 30000); // Every 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [examStarted, user, sessionId, currentQuestionIndex, answers, timeRemaining, securityPassed]);

  // Send initial student data when exam starts and security passes
  useEffect(() => {
    if (securityPassed && examStarted && user && !initialDataSent) {
      // Send initial student data - only essential info
      websocketService.send({
        type: 'student_exam_start',
        student_id: user._id,
        full_name: user.profile_details?.full_name || 'Unknown Student',
        exam_id: sessionId,
        session_id: sessionId,
        device_info: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent: navigator.userAgent.substring(0, 100), // Limit length
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        timestamp: Date.now()
      });
      
      setInitialDataSent(true);
    }
  }, [securityPassed, examStarted, user, sessionId, initialDataSent]);

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
      } finally {
        setLoading(false);
      }
    };

    loadExamQuestions();
  }, [token, sessionId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sParam = urlParams.get('s');
    const eParam = urlParams.get('e');
    const dParam = urlParams.get('d');
    const examIdParam = urlParams.get('examId');

    if (sParam && eParam && dParam) {
      try {
        // Decode parameters - FIX BASE64 PADDING
        const startTime = parseInt(atob(sParam.padEnd(sParam.length + (4 - sParam.length % 4) % 4, '=')));
        const endTime = parseInt(atob(eParam.padEnd(eParam.length + (4 - eParam.length % 4) % 4, '=')));
        const duration = parseInt(atob(dParam.padEnd(dParam.length + (4 - dParam.length % 4) % 4, '=')));
        
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeRemaining(timeLeft);
        setExamDuration(Math.floor(duration / 1000 / 60));
        
        if (now >= startTime && now <= endTime && timeLeft > 0) {
          setExamStarted(true);
        }
      } catch (error) {
        setError('Parameter ujian tidak valid');
      }
    }
  }, []);

  // Auto-save answers periodically (every 10 seconds)
  useEffect(() => {
    if (!examStarted || Object.keys(answers).length === 0) return;

    autoSaveIntervalRef.current = setInterval(() => {
      handleSaveAnswers();
    }, 10000); // Auto-save every 10 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [examStarted, answers]);

  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  const handleAnswerChange = (questionId: string, answer: any) => {
    // Update answers state
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Save to localStorage immediately
    const updatedAnswers = { ...answers, [questionId]: answer };
    try {
      localStorage.setItem(getExamAnswersKey(), JSON.stringify(updatedAnswers));
    } catch (error) {
      // Ignore localStorage errors
    }

    // Send answer update event to proctor - only essential data
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    websocketService.send({
      type: 'student_answer_update',
      student_id: user?._id,
      exam_id: sessionId,
      session_id: sessionId,
      question_id: questionId,
      question_number: questionIndex + 1,
      answer_length: typeof answer === 'string' ? answer.length : 0,
      total_answered: Object.keys(updatedAnswers).length,
      timestamp: Date.now()
    });
  };

  const handleSaveAnswers = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      setLastSaved(new Date());
      // Auto-save is handled by localStorage in handleAnswerChange

    } catch (error) {
      toast.error('Gagal menyimpan jawaban', { duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleTimeUp = () => {
    toast.error('Waktu ujian telah habis! Jawaban akan otomatis dikumpulkan.');
    
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    // Generate security report for time up
    const securityReport = examSecurityService.generateSecurityReport(
      sessionId,
      user?._id || '',
      sessionId,
      examStartTime
    );

    // Submit exam with time up
    examSecurityService.submitExamWithSecurity(token!, {
      examId: sessionId,
      sessionId: sessionId,
      answers: answers,
      securityReport: securityReport,
      submissionType: 'auto_time'
    }).then(() => {
      // Clean up and redirect
      examSecurityService.cleanupSecurityData(sessionId, user?._id || '');
      
      // Clear localStorage answers
      try {
        localStorage.removeItem(getExamAnswersKey());
      } catch (error) {
        // Ignore localStorage errors
      }
      
      // Clear all local data
      setAnswers({});
      setQuestions([]);
      
      window.location.href = '/student/exams';
    }).catch((error) => {
      // Force redirect even if submission fails
      examSecurityService.cleanupSecurityData(sessionId, user?._id || '');
      window.location.href = '/student/exams';
    });
  };

  const handleFinishExam = async () => {
    try {
      // Clear auto-save interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      // Generate security report
      const securityReport = examSecurityService.generateSecurityReport(
        sessionId,
        user?._id || '',
        sessionId,
        examStartTime
      );

      // Submit exam with security data
      await examSecurityService.submitExamWithSecurity(token!, {
        examId: sessionId,
        sessionId: sessionId,
        answers: answers,
        securityReport: securityReport,
        submissionType: 'manual'
      });

      // Clean up security data
      examSecurityService.cleanupSecurityData(sessionId, user?._id || '');
      
      // Clear localStorage answers
      try {
        localStorage.removeItem(getExamAnswersKey());
      } catch (error) {
        // Ignore localStorage errors
      }
      
      // Clear all local data
      setAnswers({});
      setQuestions([]);
      
      toast.success('Ujian telah selesai dikerjakan.');
      window.location.href = '/student/exams';
    } catch (error) {
      toast.error('Gagal menyelesaikan ujian');
    }
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

  const handleSecurityPassed = () => {
    setSecurityPassed(true);
    setExamStartTime(Date.now());
    
    // Security check passed, exam can start
  };

  const handleSecurityFailed = (reason: string) => {
    toast.error(reason);
    setTimeout(() => {
      window.location.href = '/student';
    }, 3000);
  };

  const handleCriticalViolation = (reason: string) => {
    toast.error(reason);
    
    // Generate security report for critical violation
    const securityReport = examSecurityService.generateSecurityReport(
      sessionId,
      user?._id || '',
      sessionId,
      examStartTime
    );

    // Submit exam with critical violation
    examSecurityService.submitExamWithSecurity(token!, {
      examId: sessionId,
      sessionId: sessionId,
      answers: answers,
      securityReport: securityReport,
      submissionType: 'auto_violation'
    }).then(() => {
      // Clean up and redirect
      examSecurityService.cleanupSecurityData(sessionId, user?._id || '');
      
      // Clear localStorage answers
      try {
        localStorage.removeItem(getExamAnswersKey());
      } catch (error) {
        // Ignore localStorage errors
      }
      
      // Clear all local data
      setAnswers({});
      setQuestions([]);
      
      setTimeout(() => {
        window.location.href = '/student';
      }, 2000);
    }).catch((error) => {
      // Force redirect even if submission fails
      examSecurityService.cleanupSecurityData(sessionId, user?._id || '');
      setTimeout(() => {
        window.location.href = '/student';
      }, 2000);
    });
  };

  const handleViolationUpdate = (count: number) => {
    setViolationCount(count);
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

  const scrollToQuestion = (questionIndex: number) => {
    const prevQuestionIndex = currentQuestionIndex;
    const prevQuestionId = questions[prevQuestionIndex]?.id;
    const newQuestionId = questions[questionIndex]?.id;

    // Calculate time spent on previous question
    if (prevQuestionId && questionStartTimeRef.current[prevQuestionId] && prevQuestionIndex !== questionIndex) {
      const timeSpent = Date.now() - questionStartTimeRef.current[prevQuestionId];
      websocketService.send({
        type: 'activity_event',
        activityType: 'question_time_spent',
        timestamp: Date.now(),
        studentId: user?._id,
        examId: sessionId,
        sessionId: sessionId,
        details: {
          questionId: prevQuestionId,
          questionPosition: prevQuestionIndex + 1,
          timeSpent: timeSpent,
        }
      });
    }

    // Update current question index
    setCurrentQuestionIndex(questionIndex);

    // Record start time for new question
    if (newQuestionId) {
      questionStartTimeRef.current[newQuestionId] = Date.now();
    }

    const element = document.getElementById(`question-${questionIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Show security check first
  if (!securityPassed) {
    return (
      <SecurityCheck
        onSecurityPassed={handleSecurityPassed}
        onSecurityFailed={handleSecurityFailed}
        examId={sessionId}
        studentId={user?._id || ''}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Memuat Soal Ujian
          </h3>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (error || (questions.length === 0 && !loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {error ? 'Gagal Memuat Soal Ujian' : 'Soal Ujian Tidak Tersedia'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Soal ujian tidak ditemukan atau tidak dapat diakses.'}
          </p>
          <button
            onClick={handleBackToExams}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  // Show waiting screen if exam hasn't started yet
  if (!examStarted && timeRemaining > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ujian Siap Dimulai
          </h2>
          <p className="text-gray-600 mb-6">
            Anda memiliki waktu <span className="font-semibold text-blue-600">{examDuration} menit</span> untuk menyelesaikan ujian ini.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Sisa waktu ujian:</span>
            </div>
            <div className="text-3xl font-bold text-yellow-900">
              {formatTime(timeRemaining)}
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setExamStarted(true)}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Mulai Ujian Sekarang
            </button>
            <button
              onClick={handleBackToExams}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4 bg-white rounded-2xl shadow-xl p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Waktu Ujian Habis
          </h2>
          <p className="text-gray-600 mb-6">
            Waktu untuk mengerjakan ujian telah berakhir. Jawaban Anda akan otomatis dikumpulkan.
          </p>
          <button
            onClick={handleFinishExam}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all shadow-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Kumpulkan Jawaban
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Security Monitoring */}
      <ExamMonitoring
        examId={actualExamId || sessionId}
        studentId={user?._id || ''}
        sessionId={sessionId}
        token={token}
        user={user}
        securityPassed={securityPassed}
        onCriticalViolation={handleCriticalViolation}
        onViolationUpdate={handleViolationUpdate}
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={handleBackToExams}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Kembali</span>
            </button>

            {/* Timer */}
            {examStarted && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-lg font-bold shadow-lg ${
                timeRemaining <= 300 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeRemaining)}</span>
                {timeRemaining <= 300 && (
                  <span className="text-xs font-normal ml-2 hidden sm:inline">
                    (Waktu hampir habis!)
                  </span>
                )}
              </div>
            )}

            {/* Connection Status */}
            {examStarted && (
              <div className="flex items-center space-x-2">
                {wsConnectionStatus === 'connected' && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Terkoneksi</span>
                  </div>
                )}
                {(wsConnectionStatus === 'disconnected' || wsConnectionStatus === 'reconnecting') && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs animate-pulse">
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {wsConnectionStatus === 'reconnecting' ? 'Menyambung...' : 'Terputus'}
                    </span>
                  </div>
                )}
                {wsConnectionStatus === 'error' && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Koneksi Error</span>
                  </div>
                )}
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3">
              {/* Violation Counter */}
              {violationCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{violationCount} peringatan</span>
                </div>
              )}
              
              <div className="hidden sm:flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.profile_details?.full_name || user?.login_id}
                </span>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center sm:hidden">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Progress Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Progress Ujian</h3>
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Soal Dijawab</span>
                      <span>{answeredQuestions}/{totalQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {progressPercentage.toFixed(0)}% selesai
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durasi:</span>
                    <span className="font-medium text-gray-900">{examDuration} menit</span>
                  </div>

                  {lastSaved && (
                    <div className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Otomatis tersimpan {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Navigation */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigasi Soal</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => scrollToQuestion(index)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                        answers[question.id]
                          ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                      title={`Soal ${index + 1}${answers[question.id] ? ' (Sudah dijawab)' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                    <span className="text-gray-600">Sudah dijawab</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-transparent rounded"></div>
                    <span className="text-gray-600">Belum dijawab</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleFinishExam}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Selesai Ujian
                </button>
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  id={`question-${index}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* Question Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-5 h-5 text-blue-600" />
                          <span className="text-lg font-semibold text-gray-900">
                            Soal {index + 1}
                          </span>
                        </div>
                        {answers[question.id] && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Dijawab</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Award className="w-4 h-4" />
                        <span className="font-medium">{question.points} poin</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Question Text */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div 
                          className="prose prose-sm max-w-none text-gray-900"
                          dangerouslySetInnerHTML={{ __html: question.question_text }}
                        />
                      </div>

                      {/* Answer Options (for multiple choice) */}
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                            Pilih jawaban yang benar:
                          </h4>
                          <div className="space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <label 
                                key={option.id} 
                                className={`flex items-start space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                  answers[question.id] === option.id
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option.id}
                                  checked={answers[question.id] === option.id}
                                  onChange={() => handleAnswerChange(question.id, option.id)}
                                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
                                      {String.fromCharCode(65 + optionIndex)}
                                    </span>
                                  </div>
                                  <div 
                                    className="text-gray-900 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: option.text }}
                                  />
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Essay Answer (for essay questions) */}
                      {question.question_type === 'essay' && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                            Tulis jawaban Anda:
                          </h4>
                          <textarea
                            rows={8}
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                            placeholder="Tulis jawaban Anda di sini..."
                          />
                          <div className="text-sm text-gray-500">
                            {answers[question.id] ? `${answers[question.id].length} karakter` : '0 karakter'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Final Submit Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Selesaikan Ujian
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Pastikan semua jawaban sudah benar sebelum mengumpulkan ujian.
                    </p>
                    <div className="text-sm text-gray-500 mb-6">
                      {answeredQuestions} dari {totalQuestions} soal telah dijawab
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleFinishExam}
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all shadow-lg"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Kumpulkan Ujian
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentExamTakingPage;
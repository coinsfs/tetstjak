import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '@/types/auth';
import { Clock, AlertTriangle, Flag, ChevronLeft, ChevronRight, Send, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { studentExamService, ExamQuestion } from '@/services/studentExam';
import toast from 'react-hot-toast';

interface StudentExamTakingPageProps {
  user: UserProfile | null;
  sessionId: string;
}

interface ExamAnswer {
  questionId: string;
  answer: string | string[];
  answeredAt: string;
  flagged?: boolean;
}

interface ExamState {
  sessionId: string;
  answers: Record<string, ExamAnswer>;
  currentQuestionIndex: number;
  timeRemaining: number;
  startTime: string;
  lastSaved: string;
  suspiciousActivities: string[];
}

const StudentExamTakingPage: React.FC<StudentExamTakingPageProps> = ({ user, sessionId }) => {
  const { token, logout } = useAuth();
  const { navigate } = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExamAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime] = useState(new Date().toISOString());
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityWarningMessage, setSecurityWarningMessage] = useState('');
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examWebSocket, setExamWebSocket] = useState<WebSocket | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Debug state untuk tracking
  const [debugInfo, setDebugInfo] = useState({
    questionsRequested: false,
    questionsLoaded: false,
    securityViolations: [] as Array<{
      type: string;
      message: string;
      timestamp: string;
      count: number;
    }>
  });
  
  const pageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const examStateRef = useRef<ExamState>({
    sessionId,
    answers: {},
    currentQuestionIndex: 0,
    timeRemaining: 0,
    startTime: examStartTime,
    lastSaved: new Date().toISOString(),
    suspiciousActivities: []
  });

  // Anti-cheating detection
  const detectDevTools = useCallback(() => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      handleSecurityViolation('DEVTOOLS_DETECTED', 'Developer tools terdeteksi');
    }
  }, []);

  const handleSecurityViolation = useCallback((type: string, message: string) => {
    const newCount = warningCount + 1;
    setWarningCount(newCount);
    
    // Debug log untuk pelanggaran keamanan
    const violation = {
      type,
      message,
      timestamp: new Date().toISOString(),
      count: newCount
    };
    
    console.log('🚨 SECURITY VIOLATION DETECTED:', violation);
    
    // Update debug state
    setDebugInfo(prev => ({
      ...prev,
      securityViolations: [...prev.securityViolations, violation]
    }));
    
    // Send to proctor via WebSocket
    if (examWebSocket && examWebSocket.readyState === WebSocket.OPEN) {
      examWebSocket.send(JSON.stringify({
        type: "SECURITY_VIOLATION",
        details: { 
          violation_type: type, 
          message: message,
          timestamp: new Date().toISOString(),
          warning_count: newCount
        }
      }));
    }

    // Add to suspicious activities
    examStateRef.current.suspiciousActivities.push(`${type}: ${message} at ${new Date().toISOString()}`);
    saveExamState();

    if (newCount >= 3) {
      // Redirect to dashboard after 3 warnings
      toast.error('Terlalu banyak pelanggaran keamanan. Ujian dihentikan.');
      navigate('/student');
      return;
    }

    setSecurityWarningMessage(message);
    setShowSecurityWarning(true);
  }, [warningCount, examWebSocket, navigate]);

  // Initialize exam and security measures
  useEffect(() => {
    const initializeExam = async () => {
      console.log('🎯 Initializing exam with sessionId:', sessionId);
      
      if (!token || !sessionId) {
        console.error('❌ Missing token or sessionId:', { token: !!token, sessionId });
        toast.error('Session tidak valid');
        navigate('/student/exams');
        return;
      }

      try {
        console.log('📡 Loading exam questions for session:', sessionId);
        
        // Debug: Mark bahwa kita akan request questions
        setDebugInfo(prev => ({
          ...prev,
          questionsRequested: true
        }));
        console.log('🔍 DEBUG: Questions request initiated for session:', sessionId);
        
        // Add loading state
        setLoading(true);
        
        // Load questions using session ID
        const examQuestions = await studentExamService.getExamQuestions(token, sessionId);
        console.log('✅ Exam questions loaded successfully:', {
          questionCount: examQuestions?.length || 0,
          questions: examQuestions
        });
        
        // Debug: Mark bahwa questions sudah berhasil dimuat
        setDebugInfo(prev => ({
          ...prev,
          questionsLoaded: true
        }));
        console.log('🔍 DEBUG: Questions loaded successfully. Count:', examQuestions?.length || 0);
        
        if (!examQuestions || examQuestions.length === 0) {
          console.error('❌ No questions available for exam session:', sessionId);
          toast.error('Tidak ada soal yang tersedia untuk ujian ini');
          navigate('/student/exams');
          return;
        }
        
        setQuestions(examQuestions);
        console.log('✅ Questions set in state, count:', examQuestions.length);
        
        // Try to get exam duration from session or use default
        // This should ideally come from the exam session data
        let initialTime = 90 * 60; // Default 90 minutes in seconds
        
        // If we have exam session data with duration, use it
        // This would require an additional API call to get session details
        // For now, we'll use the default
        
        setTimeRemaining(initialTime);
        examStateRef.current.timeRemaining = initialTime;
        console.log('⏰ Timer set to:', initialTime, 'seconds');

        // Load saved state if exists
        const savedState = localStorage.getItem(`exam_${sessionId}`);
        if (savedState) {
          console.log('💾 Found saved exam state, restoring...');
          try {
            const parsedState: ExamState = JSON.parse(savedState);
            
            // Validasi saved state
            if (parsedState.sessionId === sessionId) {
              setAnswers(parsedState.answers || {});
              setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0);
              // Only restore time if it's reasonable (not expired)
              const savedTime = parsedState.timeRemaining || initialTime;
              if (savedTime > 0 && savedTime <= initialTime) {
                setTimeRemaining(savedTime);
                examStateRef.current.timeRemaining = savedTime;
              } else {
                setTimeRemaining(initialTime);
                examStateRef.current.timeRemaining = initialTime;
              }
              examStateRef.current = parsedState;
              console.log('✅ Saved state restored:', {
                answersCount: Object.keys(parsedState.answers || {}).length,
                currentQuestion: parsedState.currentQuestionIndex || 0,
                timeRemaining: examStateRef.current.timeRemaining
              });
            } else {
              console.warn('⚠️ Saved state session ID mismatch, ignoring saved state');
              localStorage.removeItem(`exam_${sessionId}`);
            }
          } catch (parseError) {
            console.error('❌ Error parsing saved state:', parseError);
            localStorage.removeItem(`exam_${sessionId}`);
          }
        } else {
          console.log('📝 No saved state found, starting fresh');
        }

        // Initialize WebSocket connection to exam room with proper error handling
        try {
          const wsUrl = `wss://smkmudakalirejo.pagekite.me/api/v1/ws/exam-room/${sessionId}`;
          console.log('🔌 Connecting to WebSocket:', wsUrl);
          const ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            console.log('✅ WebSocket connected to exam room');
            setExamWebSocket(ws);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 WebSocket message received:', data);
              
              // Handle specific WebSocket messages
              if (data.type === 'EXAM_TIME_UPDATE' && data.remaining_time !== undefined) {
                setTimeRemaining(data.remaining_time);
                examStateRef.current.timeRemaining = data.remaining_time;
              } else if (data.type === 'EXAM_FORCE_SUBMIT') {
                handleSubmitExam();
              }
            } catch (parseError) {
              console.error('❌ Error parsing WebSocket message:', parseError);
            }
          };

          ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected from exam room:', event.code, event.reason);
          };

          ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
          };
        } catch (wsError) {
          console.error('❌ Failed to initialize WebSocket:', wsError);
          // Continue without WebSocket - exam can still function
        }

        // Request fullscreen
        console.log('🖥️ Requesting fullscreen mode...');
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (fullscreenError) {
          console.warn('⚠️ Fullscreen request failed:', fullscreenError);
          // Don't trigger security violation on initial load
          console.warn('⚠️ Fullscreen request denied on initial load');
        }

        console.log('✅ Exam initialization completed successfully');
      } catch (error) {
        console.error('❌ Error initializing exam:', error);
        console.error('❌ Initialization error details:', {
          sessionId,
          errorType: typeof error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        });
        
        const errorMessage = error instanceof Error 
          ? `Gagal memuat soal ujian: ${error.message}` 
          : 'Gagal memuat soal ujian. Silakan coba lagi.';
        toast.error(errorMessage);
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    };

    initializeExam();

    // Cleanup
    return () => {
      if (examWebSocket) {
        examWebSocket.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [token, sessionId, navigate, handleSecurityViolation]);

  // Security event listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Don't trigger security violations during initial load
      if (loading) return;
      
      if (document.hidden) {
        visibilityTimeoutRef.current = setTimeout(() => {
          handleSecurityViolation('TAB_SWITCH', 'Berpindah tab atau minimize window');
        }, 2000);
      } else {
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Don't trigger security violations during initial load
      if (loading) return;
      
      e.preventDefault();
      handleSecurityViolation('RIGHT_CLICK', 'Mencoba membuka context menu');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger security violations during initial load
      if (loading) return;
      
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'a') ||
        (e.ctrlKey && e.key === 'p')
      ) {
        e.preventDefault();
        handleSecurityViolation('KEYBOARD_SHORTCUT', 'Mencoba menggunakan shortcut terlarang');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't trigger security violations during initial load
      if (loading) return;
      
      e.preventDefault();
      e.returnValue = 'Yakin ingin meninggalkan ujian?';
      handleSecurityViolation('PAGE_UNLOAD', 'Mencoba meninggalkan halaman ujian');
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Don't trigger security violations during initial load or if questions aren't loaded yet
      if (!isCurrentlyFullscreen && !loading && questions.length > 0) {
        handleSecurityViolation('FULLSCREEN_EXIT', 'Keluar dari fullscreen mode');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // DevTools detection interval
    const devToolsInterval = setInterval(() => {
      // Don't trigger security violations during initial load
      if (!loading && questions.length > 0) {
        detectDevTools();
      }
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(devToolsInterval);
    };
  }, [handleSecurityViolation, detectDevTools, loading, questions.length]);

  // Timer
  useEffect(() => {
    if (timeRemaining > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          examStateRef.current.timeRemaining = newTime;
          
          if (newTime <= 0) {
            handleSubmitExam();
            return 0;
          }
          
          // Auto-save every 30 seconds
          if (newTime % 30 === 0) {
            saveExamState();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, loading]);

  const saveExamState = useCallback(() => {
    const state: ExamState = {
      ...examStateRef.current,
      answers,
      currentQuestionIndex,
      timeRemaining,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`exam_${sessionId}`, JSON.stringify(state));
    examStateRef.current = state;
  }, [answers, currentQuestionIndex, timeRemaining, sessionId]);

  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    const newAnswer: ExamAnswer = {
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
      flagged: answers[questionId]?.flagged || false
    };

    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));

    // Send to proctor via WebSocket
    if (examWebSocket && examWebSocket.readyState === WebSocket.OPEN) {
      examWebSocket.send(JSON.stringify({
        type: "ANSWER_CHANGED",
        details: { 
          question_id: questionId, 
          displayed_position: currentQuestionIndex + 1, 
          answer: answer 
        }
      }));
    }

    // Auto-save
    setTimeout(saveExamState, 100);
  }, [answers, currentQuestionIndex, examWebSocket, saveExamState]);

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;
    
    // Konfirmasi sebelum submit
    const confirmSubmit = window.confirm(
      `Apakah Anda yakin ingin menyelesaikan ujian?\n\n` +
      `Soal terjawab: ${Object.keys(answers).length} dari ${questions.length}\n` +
      `Waktu tersisa: ${formatTime(timeRemaining)}\n\n` +
      `Setelah dikonfirmasi, Anda tidak dapat mengubah jawaban lagi.`
    );
    
    if (!confirmSubmit) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('📤 Starting exam submission process');
      
      // Save final answers with error handling
      const answerEntries = Object.entries(answers);
      console.log(`💾 Saving ${answerEntries.length} answers`);
      
      for (const [questionId, answer] of answerEntries) {
        try {
          await studentExamService.submitAnswer(token!, sessionId, questionId, answer.answer);
          console.log(`✅ Answer saved for question ${questionId}`);
        } catch (answerError) {
          console.error(`❌ Failed to save answer for question ${questionId}:`, answerError);
          // Continue with other answers even if one fails
        }
      }
      
      // Submit exam
      console.log('📤 Submitting exam session');
      await studentExamService.submitExam(token!, sessionId);
      console.log('✅ Exam submitted successfully');
      
      // Clear saved state
      localStorage.removeItem(`exam_${sessionId}`);
      console.log('🗑️ Cleared saved exam state');
      
      // Send completion to proctor
      if (examWebSocket && examWebSocket.readyState === WebSocket.OPEN) {
        examWebSocket.send(JSON.stringify({
          type: "EXAM_SUBMITTED",
          details: { 
            session_id: sessionId,
            submitted_at: new Date().toISOString(),
            total_answers: Object.keys(answers).length
          }
        }));
        console.log('📡 Notified proctor of exam completion');
      }
      
      toast.success('Ujian berhasil diselesaikan!');
      
      // Small delay before navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/student/results');
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      
      let errorMessage = 'Gagal menyelesaikan ujian. Silakan coba lagi.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Koneksi internet bermasalah. Periksa koneksi dan coba lagi.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Sesi login telah berakhir. Ujian akan disimpan otomatis.';
        } else {
          errorMessage = `Gagal menyelesaikan ujian: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, answers, token, sessionId, examWebSocket, navigate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeRemaining <= 300) return 'exam-timer critical'; // 5 minutes
    if (timeRemaining <= 900) return 'exam-timer warning'; // 15 minutes
    return 'exam-timer';
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  // Debug: Log current state setiap render
  console.log('🔍 DEBUG STATE:', {
    sessionId,
    questionsRequested: debugInfo.questionsRequested,
    questionsLoaded: debugInfo.questionsLoaded,
    questionsCount: questions.length,
    securityViolationsCount: debugInfo.securityViolations.length,
    currentQuestionIndex,
    answersCount: Object.keys(answers).length,
    timeRemaining,
    warningCount
  });

  // Debug: Log semua pelanggaran keamanan
  if (debugInfo.securityViolations.length > 0) {
    console.log('🚨 ALL SECURITY VIOLATIONS:', debugInfo.securityViolations);
  }

  if (loading) {
    return (
      <div className="exam-taking-page">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-900">Memuat ujian...</p>
            <p className="text-gray-600 mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-taking-page">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">Tidak ada soal tersedia</p>
            <button 
              onClick={() => navigate('/student/exams')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Daftar Ujian
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-taking-page" ref={pageRef}>
      <div className="exam-container">
        {/* Header */}
        <div className="exam-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mode Ujian</h1>
                <p className="text-sm text-gray-600">
                  Soal {currentQuestionIndex + 1} dari {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isFullscreen && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <EyeOff className="w-5 h-5" />
                  <span className="text-sm font-medium">Tidak Fullscreen</span>
                </div>
              )}
              <div className={getTimerClass()}>
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="exam-content">
          <div className="max-w-4xl mx-auto">
            {/* Debug Panel - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900 text-white p-4 rounded-lg mb-6 text-sm font-mono">
                <h3 className="text-yellow-400 font-bold mb-2">🔍 DEBUG INFO</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>Session ID: {sessionId}</p>
                    <p>Questions Requested: {debugInfo.questionsRequested ? '✅' : '❌'}</p>
                    <p>Questions Loaded: {debugInfo.questionsLoaded ? '✅' : '❌'}</p>
                    <p>Questions Count: {questions.length}</p>
                    <p>Answers Count: {Object.keys(answers).length}</p>
                  </div>
                  <div>
                    <p>Time Remaining: {formatTime(timeRemaining)}</p>
                    <p>Warning Count: {warningCount}/3</p>
                    <p>Security Violations: {debugInfo.securityViolations.length}</p>
                    <p>Fullscreen: {isFullscreen ? '✅' : '❌'}</p>
                  </div>
                </div>
                {debugInfo.securityViolations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-red-400 font-bold">Recent Violations:</p>
                    {debugInfo.securityViolations.slice(-3).map((violation, index) => (
                      <p key={index} className="text-red-300 text-xs">
                        [{violation.timestamp.split('T')[1].split('.')[0]}] {violation.type}: {violation.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Question */}
            <div className="exam-question-card">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Soal {currentQuestion.position}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQuestion.points} Poin
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQuestion.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
                    </span>
                  </div>
                  
                  <div 
                    className="prose prose-lg max-w-none text-gray-900"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
                  />
                </div>
                
                <button
                  onClick={() => {
                    const questionId = currentQuestion.id;
                    const flagged = !currentAnswer?.flagged;
                    setAnswers(prev => ({
                      ...prev,
                      [questionId]: {
                        ...prev[questionId],
                        questionId,
                        answer: prev[questionId]?.answer || '',
                        answeredAt: prev[questionId]?.answeredAt || new Date().toISOString(),
                        flagged
                      }
                    }));
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    currentAnswer?.flagged 
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={currentAnswer?.flagged ? 'Hapus penanda' : 'Tandai soal'}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Answer Options */}
              <div className="mt-8">
                {currentQuestion.question_type === 'multiple_choice' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={option.id}
                        className={`question-option ${
                          currentAnswer?.answer === option.id ? 'selected' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name={`question_${currentQuestion.id}`}
                            value={option.id}
                            checked={currentAnswer?.answer === option.id}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                          />
                          <span className="flex-1 text-gray-900">{option.text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jawaban Anda:
                    </label>
                    <textarea
                      value={currentAnswer?.answer as string || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Tulis jawaban Anda di sini..."
                      className="essay-textarea"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Question Navigation */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigasi Soal</h3>
              <div className="question-nav-grid">
                {questions.map((question, index) => {
                  const hasAnswer = answers[question.id]?.answer;
                  const isFlagged = answers[question.id]?.flagged;
                  const isCurrent = index === currentQuestionIndex;
                  
                  let className = 'question-nav-item';
                  if (isCurrent) className += ' current';
                  else if (hasAnswer) className += ' answered';
                  else if (isFlagged) className += ' flagged';
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={className}
                    >
                      {question.position}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span>Terjawab</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded"></div>
                  <span>Ditandai</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Saat ini</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="exam-navigation">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Sebelumnya
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {Object.keys(answers).length} dari {questions.length} soal terjawab
            </span>
            
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Selesai Ujian
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Security Warning Modal */}
      {showSecurityWarning && (
        <div className="security-warning-modal">
          <div className="security-warning-content">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Peringatan Keamanan!</h2>
            <p className="text-gray-700 mb-4">{securityWarningMessage}</p>
            <p className="text-sm text-red-600 mb-6">
              Peringatan {warningCount} dari 3. Setelah 3 peringatan, ujian akan dihentikan.
            </p>
            <button
              onClick={() => setShowSecurityWarning(false)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamTakingPage;

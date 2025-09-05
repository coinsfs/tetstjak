import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/hooks/useRouter";
import { studentExamService, ExamQuestion } from "@/services/studentExam";
import { SecurityCheck, ExamMonitoring } from "@/components/security";
import { examSecurityService } from "@/services/examSecurity";
import { websocketService } from "@/services/websocket";
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
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";

interface StudentExamTakingPageProps {
  user: UserProfile | null;
  sessionId: string;
}

const StudentExamTakingPage: React.FC<StudentExamTakingPageProps> = ({
  user,
  sessionId,
}) => {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examTitle, setExamTitle] = useState<string>("");
  const [examDuration, setExamDuration] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [securityPassed, setSecurityPassed] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [examStartTime, setExamStartTime] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false); // Add submission state
  const [initialDataSent, setInitialDataSent] = useState(false);

  // WebSocket and activity tracking state
  const [wsConnectionStatus, setWsConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting" | "error"
  >("disconnected");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [actualExamId, setActualExamId] = useState<string>("");
  const questionStartTimeRef = useRef<Record<string, number>>({});
  const heartbeatIntervalRef = useRef<number | null>(null);

  // Debounce refs for essay answers
  const essayDebounceTimeoutRef = useRef<Record<string, number>>({});
  const lastEssayAnswerRef = useRef<Record<string, string>>({});

  // Auto-save interval
  const autoSaveIntervalRef = useRef<number | null>(null);

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
    const sParam = urlParams.get("s");
    const eParam = urlParams.get("e");
    const dParam = urlParams.get("d");
    const examIdParam = urlParams.get("examId");

    if (sParam && eParam && dParam) {
      try {
        // Decode parameters
        const startTime = parseInt(atob(sParam + "=="));
        const endTime = parseInt(atob(eParam + "=="));
        const duration = parseInt(atob(dParam + "=="));

        // Decode exam ID if provided
        if (examIdParam) {
          try {
            const decodedExamId = atob(
              examIdParam.padEnd(
                examIdParam.length + ((4 - (examIdParam.length % 4)) % 4),
                "="
              )
            );

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
        setError("Parameter ujian tidak valid");
      }
    } else {
      setError("Parameter ujian tidak ditemukan");
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
      setWsConnectionStatus(isConnected ? "connected" : "disconnected");
    };

    // Check status immediately and then periodically
    checkConnectionStatus();
    const statusInterval = setInterval(checkConnectionStatus, 5000);

    // Listen for proctor messages
    websocketService.onMessage("proctor_message", (data) => {});

    return () => {
      clearInterval(statusInterval);
      websocketService.offMessage("proctor_message");
    };
  }, [securityPassed]);

  // Heartbeat for activity monitoring
  useEffect(() => {
    if (!examStarted || !user?._id || !securityPassed) return;

    heartbeatIntervalRef.current = setInterval(() => {
      websocketService.send({
        type: "activity_event",
        details: {
          eventType: "heartbeat",
          timestamp: new Date().toISOString(),
          studentId: user._id,
          full_name: user?.profile_details?.full_name || "Unknown Student",
          examId: sessionId,
          sessionId: sessionId,
          current_question: currentQuestionIndex + 1,
          total_answered: Object.keys(answers).length,
          time_remaining: timeRemaining,
        },
      });
    }, 30000); // Every 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [
    examStarted,
    user,
    sessionId,
    currentQuestionIndex,
    answers,
    timeRemaining,
    securityPassed,
  ]);

  // Send initial student data when exam starts and security passes
  useEffect(() => {
    if (securityPassed && examStarted && user && !initialDataSent) {
      websocketService.send({
        type: "activity_event",
        details: {
          eventType: "student_joined_exam",
          timestamp: new Date().toISOString(),
          studentId: user._id,
          full_name: user.profile_details?.full_name || "Unknown Student",
          examId: sessionId,
          sessionId: sessionId,
          device_info: {
            screen_size: `${window.screen.width}x${window.screen.height}`,
            browser: navigator.userAgent.split(" ").pop() || "Unknown",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
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
        const questionsData = await studentExamService.getExamQuestions(
          token,
          sessionId
        );
        setQuestions(questionsData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Gagal memuat soal ujian";
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
    const sParam = urlParams.get("s");
    const eParam = urlParams.get("e");
    const dParam = urlParams.get("d");
    const examIdParam = urlParams.get("examId");

    if (sParam && eParam && dParam) {
      try {
        // Decode parameters - FIX BASE64 PADDING
        const startTime = parseInt(
          atob(
            sParam.padEnd(sParam.length + ((4 - (sParam.length % 4)) % 4), "=")
          )
        );
        const endTime = parseInt(
          atob(
            eParam.padEnd(eParam.length + ((4 - (eParam.length % 4)) % 4), "=")
          )
        );
        const duration = parseInt(
          atob(
            dParam.padEnd(dParam.length + ((4 - (dParam.length % 4)) % 4), "=")
          )
        );

        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));

        setTimeRemaining(timeLeft);
        setExamDuration(Math.floor(duration / 1000 / 60));

        if (now >= startTime && now <= endTime && timeLeft > 0) {
          setExamStarted(true);
        }
      } catch (error) {
        setError("Parameter ujian tidak valid");
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
      // Clean up essay debounce timeouts
      Object.values(essayDebounceTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleAnswerChange = (questionId: string, answer: any) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Check if this is a new answer or modification
    const previousAnswer = answers[questionId];
    const isNewAnswer =
      previousAnswer === undefined ||
      previousAnswer === null ||
      previousAnswer === "";

    // Update answers state
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Save to localStorage immediately
    const updatedAnswers = { ...answers, [questionId]: answer };
    try {
      localStorage.setItem(getExamAnswersKey(), JSON.stringify(updatedAnswers));
    } catch (error) {
      // Ignore localStorage errors
    }

    const questionIndex = questions.findIndex((q) => q.id === questionId);

    // Handle different question types with appropriate transmission logic
    if (question.question_type === "multiple_choice") {
      // For multiple choice, send immediately
      sendAnswerUpdate(
        questionId,
        questionIndex,
        answer,
        "multiple_choice",
        isNewAnswer
      );
    } else if (question.question_type === "essay") {
      // For essay, debounce the transmission
      handleEssayAnswerDebounce(questionId, questionIndex, answer, isNewAnswer);
    }
  };

  const sendAnswerUpdate = (
    questionId: string,
    questionIndex: number,
    answer: any,
    questionType: "multiple_choice" | "essay",
    isNewAnswer: boolean
  ) => {
    // Determine the correct event type based on whether this is new or modified
    const eventType = isNewAnswer ? "answer_submitted" : "answer_updated";

    // Store interaction log for new API
    const studentAnswer = typeof answer === 'string' ? answer : JSON.stringify(answer);
    examSecurityService.storeInteractionLog(
      sessionId,
      questionId,
      questionIndex + 1,
      eventType,
      studentAnswer
    );

    // Prepare simplified answer data based on question type
    let answerData: any = {};

    if (questionType === "multiple_choice") {
      // For multiple choice, find the option text
      const question = questions.find((q) => q.id === questionId);
      const selectedOption = question?.options?.find(
        (opt) => opt.id === answer
      );
      answerData = {
        selected_option: selectedOption?.text || "Unknown Option",
      };
    } else if (questionType === "essay") {
      // For essay, send character and word count
      const fullText = typeof answer === "string" ? answer : "";
      answerData = {
        character_count: fullText.length,
        word_count: fullText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
      };
    }

    // Send clean, minimal data structure
    websocketService.send({
      type: "activity_event",
      details: {
        eventType: eventType,
        timestamp: new Date().toISOString(),
        studentId: user?._id,
        full_name: user?.profile_details?.full_name || "Unknown Student",
        examId: sessionId,
        sessionId: sessionId,
        questionId: questionId,
        questionPosition: questionIndex + 1,
        question: {
          number: questionIndex + 1,
          type: questionType,
        },
        answer: answerData,
      },
    });
  };

  const handleEssayAnswerDebounce = (
    questionId: string,
    questionIndex: number,
    answer: string,
    isNewAnswer: boolean
  ) => {
    // Clear existing timeout for this question
    if (essayDebounceTimeoutRef.current[questionId]) {
      clearTimeout(essayDebounceTimeoutRef.current[questionId]);
    }

    // Store the current answer
    lastEssayAnswerRef.current[questionId] = answer;

    // Set new timeout for debounced transmission
    essayDebounceTimeoutRef.current[questionId] = setTimeout(() => {
      const currentAnswer = lastEssayAnswerRef.current[questionId];
      if (currentAnswer !== undefined) {
        sendAnswerUpdate(
          questionId,
          questionIndex,
          currentAnswer,
          "essay",
          isNewAnswer
        );
      }

      // Clean up timeout reference
      delete essayDebounceTimeoutRef.current[questionId];
    }, 2000); // 2 second debounce
  };

  const handleSaveAnswers = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setLastSaved(new Date());
      // Auto-save is handled by localStorage in handleAnswerChange
    } catch (error) {
      toast.error("Gagal menyimpan jawaban", { duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleTimeUp = () => {
    if (submitting) return; // Prevent multiple submissions
    
    toast.error("Waktu ujian telah habis! Jawaban akan otomatis dikumpulkan.");

    setSubmitting(true);
    
    // Prevent tab switching during auto-submission
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Waktu habis, sedang mengumpulkan jawaban otomatis...';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Generate security report for time up
    const securityReport = examSecurityService.generateSecurityReport(
      actualExamId || sessionId,  // ✅ FIXED: Use actualExamId as examId parameter
      user?._id || "",            // ✅ CORRECT: studentId
      sessionId,                   // ✅ CORRECT: sessionId
      examStartTime                // ✅ CORRECT: startTime
    );
    
    // Send time up monitoring message
    websocketService.send({
      type: 'activity_event',
      details: {
        eventType: 'exam_time_up',
        timestamp: new Date().toISOString(),
        studentId: user?._id,
        full_name: user?.profile_details?.full_name || 'Unknown Student',
        examId: sessionId,
        sessionId: sessionId,
        total_answered: Object.keys(answers).length,
        submission_type: 'auto_time'
      }
    });

    // Submit exam with time up
    examSecurityService
      .submitExam(
        token!,
        sessionId,
        answers,
        securityReport,
        "auto_time"
      )
      .then(async (result) => {
        // Send completion message
        websocketService.send({
          type: 'activity_event',
          details: {
            eventType: 'exam_auto_submission_completed',
            timestamp: new Date().toISOString(),
            studentId: user?._id,
            full_name: user?.profile_details?.full_name || 'Unknown Student',
            examId: sessionId,
            sessionId: sessionId,
            submission_result: result.success ? 'success' : 'failed'
          }
        });
        
        // Wait for message to be sent
        await new Promise(resolve => setTimeout(resolve, 1000));
        websocketService.disconnect();
        
        // Clean up and redirect
        examSecurityService.cleanupSecurityData(sessionId, user?._id || "");

        // Clear localStorage answers
        try {
          localStorage.removeItem(getExamAnswersKey());
        } catch (error) {
          // Ignore localStorage errors
        }

        // Clear all local data
        setAnswers({});
        setQuestions([]);
        
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.location.href = "/student/exams";
      })
      .catch(async (error) => {
        // Send failure message
        try {
          websocketService.send({
            type: 'activity_event',
            details: {
              eventType: 'exam_auto_submission_failed',
              timestamp: new Date().toISOString(),
              studentId: user?._id,
              full_name: user?.profile_details?.full_name || 'Unknown Student',
              examId: sessionId,
              sessionId: sessionId,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          websocketService.disconnect();
        } catch (wsError) {
          console.error('WebSocket cleanup error:', wsError);
        }
        
        // Force redirect even if submission fails
        examSecurityService.cleanupSecurityData(sessionId, user?._id || "");
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.location.href = "/student/exams";
      });
  };

  const handleFinishExam = async () => {
    if (submitting) return; // Prevent multiple submissions
    
    try {
      setSubmitting(true);
      toast.loading('Mengumpulkan jawaban ujian...', { duration: 0, id: 'submit-exam' });
      
      // Prevent tab switching during submission
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Sedang mengumpulkan jawaban, jangan keluar dari halaman ini.';
        return e.returnValue;
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Clear auto-save interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      // Generate security report
      const securityReport = examSecurityService.generateSecurityReport(
        actualExamId || sessionId,  // ✅ FIXED: Use actualExamId as examId parameter
        user?._id || "",            // ✅ CORRECT: studentId  
        sessionId,                   // ✅ CORRECT: sessionId
        examStartTime                // ✅ CORRECT: startTime
      );
      
      // Send final monitoring message
      websocketService.send({
        type: 'activity_event',
        details: {
          eventType: 'exam_submission_started',
          timestamp: new Date().toISOString(),
          studentId: user?._id,
          full_name: user?.profile_details?.full_name || 'Unknown Student',
          examId: sessionId,
          sessionId: sessionId,
          total_answered: Object.keys(answers).length,
          submission_type: 'manual'
        }
      });

      // Submit exam with security data
      const submitResult = await examSecurityService.submitExam(
        token!,
        sessionId,
        answers,
        securityReport,
        "manual"
      );
      
      // Send completion message to monitoring
      websocketService.send({
        type: 'activity_event',
        details: {
          eventType: 'exam_submission_completed',
          timestamp: new Date().toISOString(),
          studentId: user?._id,
          full_name: user?.profile_details?.full_name || 'Unknown Student',
          examId: sessionId,
          sessionId: sessionId,
          submission_result: submitResult.success ? 'success' : 'failed',
          message: submitResult.message
        }
      });
      
      // Wait a moment for WebSocket message to be sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Disconnect WebSocket
      websocketService.disconnect();
      
      // Clean up security data
      examSecurityService.cleanupSecurityData(sessionId, user?._id || "");

      // Clear localStorage answers
      try {
        localStorage.removeItem(getExamAnswersKey());
      } catch (error) {
        // Ignore localStorage errors
      }

      // Clear all local data
      setAnswers({});
      setQuestions([]);
      
      // Remove beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);

      toast.dismiss('submit-exam');
      toast.success("Ujian telah berhasil dikumpulkan!");
      
      // Redirect after cleanup
      setTimeout(() => {
        window.location.href = "/student/exams";
      }, 1500);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.dismiss('submit-exam');
      toast.error("Terjadi kesalahan saat mengumpulkan ujian. Mencoba lagi...");
      
      // Still try to send completion message even if submission failed
      try {
        websocketService.send({
          type: 'activity_event',
          details: {
            eventType: 'exam_submission_failed',
            timestamp: new Date().toISOString(),
            studentId: user?._id,
            full_name: user?.profile_details?.full_name || 'Unknown Student',
            examId: sessionId,
            sessionId: sessionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        
        // Wait for message to be sent
        await new Promise(resolve => setTimeout(resolve, 1000));
        websocketService.disconnect();
      } catch (wsError) {
        console.error('WebSocket cleanup error:', wsError);
      }
      
      setSubmitting(false);
    }
  };

  const handleBackToExams = () => {
    if (examStarted && timeRemaining > 0) {
      const confirmLeave = window.confirm(
        "Anda sedang mengerjakan ujian. Apakah Anda yakin ingin keluar? Jawaban yang belum disimpan akan hilang."
      );
      if (!confirmLeave) return;
    }
    window.location.href = "/student/exams";
  };

  const handleSecurityPassed = () => {
    setSecurityPassed(true);
    setExamStartTime(Date.now());

    // Security check passed, exam can start
  };

  const handleSecurityFailed = (reason: string) => {
    toast.error(reason);
    setTimeout(() => {
      window.location.href = "/student";
    }, 3000);
  };

  const handleCriticalViolation = async (reason: string) => {
    if (submitting) return; // Prevent multiple submissions
    
    toast.error(reason);
    setSubmitting(true);
    
    // Prevent tab switching during violation submission
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Pelanggaran terdeteksi, sedang mengumpulkan jawaban...';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Generate security report for critical violation
    const securityReport = examSecurityService.generateSecurityReport(
      actualExamId || sessionId,  // ✅ FIXED: Use actualExamId as examId parameter
      user?._id || "",            // ✅ CORRECT: studentId
      sessionId,                   // ✅ CORRECT: sessionId  
      examStartTime                // ✅ CORRECT: startTime
    );
    
    // Send violation detection message
    websocketService.send({
      type: 'activity_event',
      details: {
        eventType: 'critical_violation_detected',
        timestamp: new Date().toISOString(),
        studentId: user?._id,
        full_name: user?.profile_details?.full_name || 'Unknown Student',
        examId: sessionId,
        sessionId: sessionId,
        violation_reason: reason,
        total_answered: Object.keys(answers).length,
        submission_type: 'auto_violation'
      }
    });

    // Submit exam with critical violation
    try {
      const result = await examSecurityService.submitExam(
        token!,
        sessionId,
        answers,
        securityReport,
        "auto_violation"
      );
      
      // Send completion message
      websocketService.send({
        type: 'activity_event',
        details: {
          eventType: 'exam_violation_submission_completed',
          timestamp: new Date().toISOString(),
          studentId: user?._id,
          full_name: user?.profile_details?.full_name || 'Unknown Student',
          examId: sessionId,
          sessionId: sessionId,
          submission_result: result.success ? 'success' : 'failed'
        }
      });
      
      // Wait for message to be sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      websocketService.disconnect();
      
      // Clean up and redirect
      examSecurityService.cleanupSecurityData(sessionId, user?._id || "");

      // Clear localStorage answers
      try {
        localStorage.removeItem(getExamAnswersKey());
      } catch (error) {
        // Ignore localStorage errors
      }

      // Clear all local data
      setAnswers({});
      setQuestions([]);
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      setTimeout(() => {
        window.location.href = "/student";
      }, 2000);
      
    } catch (error) {
      // Send failure message
      try {
        websocketService.send({
          type: 'activity_event',
          details: {
            eventType: 'exam_violation_submission_failed',
            timestamp: new Date().toISOString(),
            studentId: user?._id,
            full_name: user?.profile_details?.full_name || 'Unknown Student',
            examId: sessionId,
            sessionId: sessionId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        websocketService.disconnect();
      } catch (wsError) {
        console.error('WebSocket cleanup error:', wsError);
      }
      
      // Force redirect even if submission fails
      examSecurityService.cleanupSecurityData(sessionId, user?._id || "");
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      setTimeout(() => {
        window.location.href = "/student";
      }, 2000);
    }
  };

  const handleViolationUpdate = (count: number) => {
    setViolationCount(count);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const scrollToQuestion = (questionIndex: number) => {
    const prevQuestionIndex = currentQuestionIndex;
    const prevQuestionId = questions[prevQuestionIndex]?.id;
    const newQuestionId = questions[questionIndex]?.id;

    // Calculate time spent on previous question
    if (
      prevQuestionId &&
      questionStartTimeRef.current[prevQuestionId] &&
      prevQuestionIndex !== questionIndex
    ) {
      const timeSpent =
        Date.now() - questionStartTimeRef.current[prevQuestionId];
      websocketService.send({
        type: "activity_event",
        details: {
          eventType: "question_navigation",
          timestamp: new Date().toISOString(),
          studentId: user?._id,
          full_name: user?.profile_details?.full_name || "Unknown Student",
          examId: sessionId,
          sessionId: sessionId,
          navigation: {
            from_question: prevQuestionIndex + 1,
            to_question: questionIndex + 1,
            time_spent_seconds: Math.round(timeSpent / 1000),
          },
        },
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
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage =
    totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Show security check first
  if (!securityPassed) {
    return (
      <SecurityCheck
        onSecurityPassed={handleSecurityPassed}
        onSecurityFailed={handleSecurityFailed}
        examId={sessionId}
        studentId={user?._id || ""}
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
            {error ? "Gagal Memuat Soal Ujian" : "Soal Ujian Tidak Tersedia"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Soal ujian tidak ditemukan atau tidak dapat diakses."}
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
            Anda memiliki waktu{" "}
            <span className="font-semibold text-blue-600">
              {examDuration} menit
            </span>{" "}
            untuk menyelesaikan ujian ini.
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
            Waktu untuk mengerjakan ujian telah berakhir. Jawaban Anda akan
            otomatis dikumpulkan.
          </p>
          <button
            onClick={handleFinishExam}
            disabled={submitting}
            className={`w-full inline-flex items-center justify-center px-6 py-4 font-semibold rounded-xl focus:outline-none focus:ring-4 transition-all shadow-lg ${
              submitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Mengumpulkan...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Kumpulkan Jawaban
              </>
            )}
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
        studentId={user?._id || ""}
        sessionId={sessionId}
        token={token}
        user={user}
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
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-lg font-bold shadow-lg ${
                  timeRemaining <= 300
                    ? "bg-red-100 text-red-800 animate-pulse"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
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
                {wsConnectionStatus === "connected" && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Terkoneksi</span>
                  </div>
                )}
                {(wsConnectionStatus === "disconnected" ||
                  wsConnectionStatus === "reconnecting") && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs animate-pulse">
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {wsConnectionStatus === "reconnecting"
                        ? "Menyambung..."
                        : "Terputus"}
                    </span>
                  </div>
                )}
                {wsConnectionStatus === "error" && (
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    Progress Ujian
                  </h3>
                  <Award className="w-6 h-6 text-blue-600" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Soal Dijawab</span>
                      <span>
                        {answeredQuestions}/{totalQuestions}
                      </span>
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
                    <span className="font-medium text-gray-900">
                      {examDuration} menit
                    </span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Navigasi Soal
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => scrollToQuestion(index)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                        answers[question.id]
                          ? "bg-green-100 text-green-800 border-2 border-green-300 shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                      title={`Soal ${index + 1}${
                        answers[question.id] ? " (Sudah dijawab)" : ""
                      }`}
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
                  disabled={submitting}
                  className={`w-full inline-flex items-center justify-center px-4 py-3 font-medium rounded-xl focus:outline-none focus:ring-4 transition-all shadow-lg ${
                    submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Mengumpulkan...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Selesai Ujian
                    </>
                  )}
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
                        <span className="font-medium">
                          {question.points} poin
                        </span>
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
                          dangerouslySetInnerHTML={{
                            __html: question.question_text,
                          }}
                        />
                      </div>

                      {/* Answer Options (for multiple choice) */}
                      {question.question_type === "multiple_choice" &&
                        question.options && (
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
                                      ? "border-blue-500 bg-blue-50 shadow-md"
                                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={option.id}
                                    checked={answers[question.id] === option.id}
                                    onChange={() =>
                                      handleAnswerChange(question.id, option.id)
                                    }
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
                                      dangerouslySetInnerHTML={{
                                        __html: option.text,
                                      }}
                                    />
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Essay Answer (for essay questions) */}
                      {question.question_type === "essay" && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                            Tulis jawaban Anda:
                          </h4>
                          <textarea
                            rows={8}
                            value={answers[question.id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(question.id, e.target.value)
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                            placeholder="Tulis jawaban Anda di sini..."
                          />
                          <div className="text-sm text-gray-500">
                            {answers[question.id]
                              ? `${answers[question.id].length} karakter`
                              : "0 karakter"}
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
                      Pastikan semua jawaban sudah benar sebelum mengumpulkan
                      ujian.
                    </p>
                    <div className="text-sm text-gray-500 mb-6">
                      {answeredQuestions} dari {totalQuestions} soal telah
                      dijawab
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleFinishExam}
                      disabled={submitting}
                      className={`inline-flex items-center justify-center px-6 py-3 font-medium rounded-xl focus:outline-none focus:ring-4 transition-all shadow-lg ${
                        submitting
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Mengumpulkan Ujian...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Kumpulkan Ujian
                        </>
                      )}
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

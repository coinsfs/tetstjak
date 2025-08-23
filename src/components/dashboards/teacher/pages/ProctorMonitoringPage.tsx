import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { teacherExamService } from '@/services/teacherExam';
import { 
  AlertCircle, 
  User, 
  Clock, 
  Activity, 
  Eye, 
  CheckCircle, 
  WifiOff, 
  Wifi, 
  ArrowLeft, 
  Users, 
  Shield, 
  Monitor,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Filter,
  Search,
  AlertTriangle,
  StopCircle,
  Megaphone,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  BellOff
} from 'lucide-react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/constants/config';

// Enhanced interfaces for comprehensive monitoring
interface RealtimeEvent {
  messageType: string;
  type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  studentId: string;
  examId: string;
  sessionId: string;
  details: any;
  userAgent?: string;
  url?: string;
  tabActive?: boolean;
  mousePosition?: { x: number; y: number; clicks: number };
  keyboardStats?: { keystrokes: number; suspiciousKeys: number };
  status?: 'started' | 'ended' | 'left_page' | 'rejoined_page' | 'submitted';
  full_name?: string;
  questionId?: string;
  newAnswer?: any;
  questionIndex?: number;
  answersCount?: number;
  activityType?: string;
}

interface StudentSessionStatus {
  student_id: string;
  session_id: string;
  full_name: string;
  status: 'online' | 'offline' | 'examming' | 'submitted';
  last_activity: number;
  violation_count: number;
  critical_violations: number;
  ws_status: 'connecting' | 'open' | 'closed' | 'error';
  start_time?: number;
  answers: Record<string, any>;
  answered_questions: number;
  total_questions: number;
  current_question?: number;
  time_spent: number;
  suspicious_score: number;
}

interface BroadcastMessage {
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

interface ActivityFilter {
  type: 'all' | 'violations' | 'activities' | 'answers';
  student: string;
  severity: 'all' | 'low' | 'medium' | 'high' | 'critical';
}

const ProctorMonitoringPage: React.FC = () => {
  const { currentPath } = useRouter();
  const examId = currentPath.split('/').pop();
  const { token } = useAuth();
  const { navigate } = useRouter();

  // Core state
  const [examTitle, setExamTitle] = useState<string>('Memuat...');
  const [studentSessions, setStudentSessions] = useState<StudentSessionStatus[]>([]);
  const [violationEvents, setViolationEvents] = useState<RealtimeEvent[]>([]);
  const [examActivityEvents, setExamActivityEvents] = useState<RealtimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExamQuestions, setTotalExamQuestions] = useState<number>(0);
  
  // Connection and statistics
  const [connectionStats, setConnectionStats] = useState({
    total: 0,
    connected: 0,
    connecting: 0,
    disconnected: 0
  });
  
  // Communication state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'critical'>('info');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastMessage[]>([]);
  
  // UI state
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>({
    type: 'all',
    student: 'all',
    severity: 'all'
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  
  // Refs
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activityFeedRef = useRef<HTMLDivElement>(null);

  // Quick message templates
  const quickMessages = [
    { type: 'info' as const, message: 'Ujian berjalan dengan baik. Tetap fokus dan kerjakan dengan tenang.' },
    { type: 'warning' as const, message: 'Perhatian: Waktu ujian tersisa 15 menit. Periksa jawaban Anda.' },
    { type: 'warning' as const, message: 'Mohon kembali ke tab ujian dan jangan berpindah ke aplikasi lain.' },
    { type: 'critical' as const, message: 'PERINGATAN: Aktivitas mencurigakan terdeteksi. Ujian sedang dipantau.' },
    { type: 'info' as const, message: 'Jika mengalami masalah teknis, angkat tangan atau hubungi pengawas.' },
    { type: 'warning' as const, message: 'Waktu ujian tersisa 5 menit. Segera selesaikan dan kumpulkan jawaban.' }
  ];

  // Initialize audio for notifications
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = { play: createBeepSound } as any;
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.play();
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, [soundEnabled]);

  // Enhanced WebSocket message handler
  const handleWsMessage = useCallback((event: MessageEvent, sessionId: string) => {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);
      console.log(`WS message from ${sessionId}:`, data);

      // Play sound for critical violations
      if (data.messageType === 'violation_event' && data.severity === 'critical') {
        playNotificationSound();
      }

      // Categorize events
      if (data.messageType === 'violation_event') {
        setViolationEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      } else if (data.messageType === 'exam_activity') {
        setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      }

      // Handle student lifecycle events
      if (data.messageType === 'student_join') {
        setStudentSessions(prevSessions => {
          const existingIndex = prevSessions.findIndex(s => s.session_id === data.sessionId);
          if (existingIndex === -1) {
            const newSession: StudentSessionStatus = {
              student_id: data.studentId,
              session_id: data.sessionId,
              full_name: data.full_name || `Student ${data.studentId.slice(-6)}`,
              status: 'online',
              last_activity: data.timestamp,
              violation_count: 0,
              critical_violations: 0,
              ws_status: 'open',
              start_time: data.timestamp,
              answers: {},
              answered_questions: 0,
              total_questions: totalExamQuestions,
              time_spent: 0,
              suspicious_score: 0
            };
            return [...prevSessions, newSession];
          }
          return prevSessions;
        });
      } else if (data.messageType === 'student_leave') {
        setStudentSessions(prevSessions => 
          prevSessions.map(s => 
            s.session_id === data.sessionId 
              ? { ...s, status: 'offline', ws_status: 'closed' }
              : s
          )
        );
      }

      // Update student status based on events
      setStudentSessions(prevSessions => {
        const updatedSessions = [...prevSessions];
        const sessionIndex = updatedSessions.findIndex(s => s.session_id === sessionId);

        if (sessionIndex > -1) {
          const currentSession = updatedSessions[sessionIndex];
          currentSession.last_activity = data.timestamp;

          // Handle violations
          if (data.messageType === 'violation_event' && data.severity) {
            currentSession.violation_count += 1;
            if (data.severity === 'critical') {
              currentSession.critical_violations += 1;
            }
            
            // Update suspicious score
            const severityScores = { low: 1, medium: 3, high: 5, critical: 10 };
            currentSession.suspicious_score += severityScores[data.severity];
          }
          
          // Handle session status changes
          else if (data.messageType === 'session_status' && data.status) {
            if (data.status === 'started' || data.status === 'rejoined_page') {
              currentSession.status = 'examming';
              if (data.status === 'started') {
                currentSession.answers = {};
                currentSession.answered_questions = 0;
                currentSession.start_time = data.timestamp;
              }
            } else if (data.status === 'left_page') {
              currentSession.status = 'offline';
            } else if (data.status === 'submitted') {
              currentSession.status = 'submitted';
            }
          }
          
          // Handle exam activities
          else if (data.messageType === 'exam_activity') {
            if (data.type === 'answer_changed' || data.activityType === 'answer_changed') {
              if (data.questionId && data.newAnswer !== undefined) {
                currentSession.answers[data.questionId] = data.newAnswer;
                currentSession.answered_questions = Object.values(currentSession.answers).filter(answer => 
                  answer !== null && answer !== undefined && answer !== ''
                ).length;
              }
            } else if (data.type === 'question_viewed' || data.activityType === 'question_viewed') {
              if (data.questionIndex !== undefined) {
                currentSession.current_question = data.questionIndex;
              }
            } else if (data.type === 'auto_save' || data.activityType === 'auto_save') {
              if (data.answersCount !== undefined) {
                currentSession.answered_questions = Math.max(currentSession.answered_questions, data.answersCount);
              }
            }
          }

          // Calculate time spent
          if (currentSession.start_time) {
            currentSession.time_spent = Math.floor((data.timestamp - currentSession.start_time) / 1000);
          }

          return updatedSessions;
        }
        return prevSessions;
      });
    } catch (error) {
      console.error(`Error parsing WS message from ${sessionId}:`, error);
    }
  }, [playNotificationSound, totalExamQuestions]);

  // Setup main monitoring WebSocket connection
  const setupMainWebSocket = useCallback((currentToken: string, examId: string) => {
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/exam-room/${examId}?token=${currentToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Main monitoring WebSocket connected');
      toast.success('Terhubung ke sistem monitoring');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Main monitoring WS message:', data);
        
        // Handle different message types
        if (data.messageType === 'student_join') {
          setStudentSessions(prevSessions => {
            const existingIndex = prevSessions.findIndex(s => s.session_id === data.sessionId);
            if (existingIndex === -1) {
              const newSession: StudentSessionStatus = {
                student_id: data.studentId,
                session_id: data.sessionId,
                full_name: data.full_name || `Student ${data.studentId.slice(-6)}`,
                status: 'online',
                last_activity: data.timestamp,
                violation_count: 0,
                critical_violations: 0,
                ws_status: 'open',
                start_time: data.timestamp,
                answers: {},
                answered_questions: 0,
                total_questions: totalExamQuestions,
                time_spent: 0,
                suspicious_score: 0
              };
              return [...prevSessions, newSession];
            } else {
              return prevSessions.map(s => 
                s.session_id === data.sessionId 
                  ? { ...s, status: 'online', ws_status: 'open', last_activity: data.timestamp }
                  : s
              );
            }
          });
        } else if (data.messageType === 'student_leave') {
          setStudentSessions(prevSessions => 
            prevSessions.map(s => 
              s.session_id === data.sessionId 
                ? { ...s, status: 'offline', ws_status: 'closed', last_activity: data.timestamp }
                : s
            )
          );
        } else if (data.messageType === 'violation_event') {
          setViolationEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
          if (data.severity === 'critical') {
            playNotificationSound();
          }
        } else if (data.messageType === 'exam_activity') {
          setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
        }

        // Process the message through the main handler
        handleWsMessage(event, data.sessionId || 'main');
      } catch (error) {
        console.error('Error parsing main monitoring WS message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Main monitoring WebSocket disconnected');
      toast.error('Koneksi monitoring terputus');
      setStudentSessions(prevSessions => 
        prevSessions.map(s => ({ ...s, status: 'offline', ws_status: 'closed' }))
      );
    };

    ws.onerror = (error) => {
      console.error('Main monitoring WebSocket error:', error);
      toast.error('Error koneksi monitoring');
    };

    return ws;
  }, [totalExamQuestions, handleWsMessage, playNotificationSound]);

  // Update connection stats
  const updateConnectionStats = useCallback(() => {
    setConnectionStats({
      total: studentSessions.length,
      connected: studentSessions.filter(s => s.ws_status === 'open' && s.status !== 'offline').length,
      connecting: studentSessions.filter(s => s.ws_status === 'connecting').length,
      disconnected: studentSessions.filter(s => s.ws_status === 'closed' || s.status === 'offline').length
    });
  }, [studentSessions]);

  // Update connection stats when student sessions change
  useEffect(() => {
    updateConnectionStats();
  }, [studentSessions, updateConnectionStats]);

  // Initialize exam and WebSocket connection
  useEffect(() => {
    const fetchExamAndSessions = async () => {
      if (!examId || !token) {
        toast.error('ID Ujian atau token tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        // Fetch exam details
        try {
          const examDetailsResponse = await teacherExamService.getTeacherExams(token, { page: 1, limit: 100 });
          const exam = examDetailsResponse.data.find(e => e._id === examId);
          if (exam) {
            setExamTitle(exam.title);
            const totalQuestions = exam.question_ids?.length || 0;
            setTotalExamQuestions(totalQuestions);
          } else {
            setExamTitle(`Ujian ${examId.slice(-8)}`);
            setTotalExamQuestions(0);
          }
        } catch (error) {
          console.warn('Could not fetch exam details, using fallback title');
          setExamTitle(`Ujian ${examId.slice(-8)}`);
          setTotalExamQuestions(0);
        }

        // Setup main monitoring WebSocket connection
        const mainWs = setupMainWebSocket(token, examId);
        wsConnectionsRef.current.set('main', mainWs);

      } catch (error) {
        console.error('Error setting up exam monitoring:', error);
        toast.error('Gagal memuat monitoring ujian.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndSessions();

    return () => {
      wsConnectionsRef.current.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      });
      wsConnectionsRef.current.clear();
    };
  }, [examId, token, setupMainWebSocket]);

  // Broadcast message to all students
  const sendBroadcastMessage = useCallback(async (message: string, type: 'info' | 'warning' | 'critical') => {
    const mainWs = wsConnectionsRef.current.get('main');
    if (mainWs && mainWs.readyState === WebSocket.OPEN) {
    const message = {
      type: 'proctor_broadcast',
      message: broadcastMessage,
      timestamp: Date.now(),
      examId: examId
    };
    
    websocketService.send(message);
    toast.success('Pesan broadcast terkirim');
    setBroadcastMessage('');
        timestamp: Date.now()
      }, ...prev].slice(0, 20));

      toast.success('Pesan berhasil dikirim ke semua siswa');
    } else {
      toast.error('Koneksi tidak tersedia untuk mengirim pesan');
    }
  }, [examId]);

  // Emergency terminate exam
  const terminateExam = useCallback(async () => {
    const mainWs = wsConnectionsRef.current.get('main');
    const message = {
      type: 'terminate_exam',
      examId: examId,
      timestamp: Date.now(),
      reason: 'Terminated by proctor'
    };
    
    websocketService.send(message);
    toast.success('Ujian dihentikan untuk semua siswa');
    }
  }, [examId]);

  // Filter activities based on current filter settings
  const filteredActivities = useCallback(() => {
    let activities: RealtimeEvent[] = [];
    
    if (activityFilter.type === 'all') {
      activities = [...violationEvents, ...examActivityEvents];
    } else if (activityFilter.type === 'violations') {
      activities = violationEvents;
    } else if (activityFilter.type === 'activities') {
      activities = examActivityEvents;
    } else if (activityFilter.type === 'answers') {
      activities = examActivityEvents.filter(e => e.type === 'answer_changed' || e.activityType === 'answer_changed');
    }

    // Filter by student
    if (activityFilter.student !== 'all') {
      activities = activities.filter(a => a.studentId === activityFilter.student);
    }

    // Filter by severity (for violations)
    if (activityFilter.severity !== 'all') {
      activities = activities.filter(a => a.severity === activityFilter.severity);
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [violationEvents, examActivityEvents, activityFilter]);

  // Utility functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-gray-500 bg-gray-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'examming': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'tab_switch': 'Pindah Tab',
      'devtools_detected': 'DevTools Terdeteksi',
      'copy_attempt': 'Percobaan Copy',
      'paste_attempt': 'Percobaan Paste',
      'right_click_attempt': 'Klik Kanan',
      'fullscreen_exit': 'Keluar Fullscreen',
      'session_started': 'Mulai Ujian',
      'session_ended': 'Selesai Ujian',
      'answer_changed': 'Ubah Jawaban',
      'question_navigated': 'Navigasi Soal',
      'question_viewed': 'Lihat Soal',
      'auto_save': 'Auto Save',
      'mouse_leave_window': 'Mouse Keluar Window',
      'rapid_clicking': 'Klik Cepat',
      'rapid_typing': 'Ketik Cepat',
      'suspicious_key': 'Tombol Mencurigakan',
      'suspicious_combination': 'Kombinasi Tombol Mencurigakan',
      'screen_height_reduction': 'Pengurangan Tinggi Layar'
    };
    return labels[type] || type.replace(/_/g, ' ');
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

  const handleBackToExams = () => {
    navigate('/teacher/exams');
  };

  const exportActivityReport = () => {
    const reportData = {
      examTitle,
      examId,
      timestamp: new Date().toISOString(),
      students: studentSessions,
      violations: violationEvents,
      activities: examActivityEvents,
      statistics: {
        totalStudents: studentSessions.length,
        onlineStudents: connectionStats.connected,
        averageProgress: studentSessions.length > 0 && totalExamQuestions > 0 ? 
          Math.round((studentSessions.reduce((sum, s) => sum + s.answered_questions, 0) / studentSessions.length / totalExamQuestions) * 100) : 0,
        totalViolations: studentSessions.reduce((sum, s) => sum + s.violation_count, 0)
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-monitoring-report-${examId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Laporan monitoring berhasil diunduh');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard monitoring...</p>
        </div>
      </div>
    );
  }

  const averageProgress = studentSessions.length > 0 && totalExamQuestions > 0 ? 
    Math.round((studentSessions.reduce((sum, s) => sum + s.answered_questions, 0) / studentSessions.length / totalExamQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToExams}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Ujian
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Monitoring Proctor</h1>
                  <p className="text-sm text-gray-600">{examTitle}</p>
                </div>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center space-x-4">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}
                title={soundEnabled ? 'Matikan suara notifikasi' : 'Nyalakan suara notifikasi'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Alerts Toggle */}
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  alertsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
                title={alertsEnabled ? 'Matikan alert' : 'Nyalakan alert'}
              >
                {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>

              {/* Broadcast Message Button */}
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Kirim Pesan
              </button>

              {/* Emergency Terminate Button */}
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Hentikan Ujian
              </button>

              {/* Export Report Button */}
              <button
                onClick={exportActivityReport}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.connected}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.connecting}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.disconnected}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900">{studentSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sedang Ujian</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentSessions.filter(s => s.status === 'examming').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata Progres</p>
                <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pelanggaran</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentSessions.reduce((sum, s) => sum + s.violation_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kritis</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentSessions.reduce((sum, s) => sum + s.critical_violations, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Student Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" /> Status Siswa Real-time
              </h2>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedStudent || 'all'}
                  onChange={(e) => setSelectedStudent(e.target.value === 'all' ? null : e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Siswa</option>
                  {studentSessions.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Reset filter"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {studentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada siswa yang terdeteksi.</p>
                </div>
              ) : (
                studentSessions
                  .filter(student => !selectedStudent || student.student_id === selectedStudent)
                  .sort((a, b) => {
                    // Sort by suspicious score (highest first), then by progress
                    if (a.suspicious_score !== b.suspicious_score) {
                      return b.suspicious_score - a.suspicious_score;
                    }
                    return b.answered_questions - a.answered_questions;
                  })
                  .map(student => {
                    const progressPercentage = student.total_questions > 0 ? 
                      (student.answered_questions / student.total_questions) * 100 : 0;
                    
                    return (
                      <div 
                        key={student.session_id} 
                        className={`bg-gray-50 border rounded-xl p-4 hover:shadow-md transition-all ${
                          student.critical_violations > 0 ? 'border-red-300 bg-red-50' :
                          student.suspicious_score > 10 ? 'border-orange-300 bg-orange-50' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              student.critical_violations > 0 ? 'bg-red-100' :
                              student.suspicious_score > 10 ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}>
                              <User className={`w-5 h-5 ${
                                student.critical_violations > 0 ? 'text-red-600' :
                                student.suspicious_score > 10 ? 'text-orange-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{student.full_name}</h3>
                              <p className="text-xs text-gray-500">ID: {student.student_id.slice(-8)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                            {student.ws_status === 'open' ? 
                              <Wifi className="w-4 h-4 text-green-500" title="WebSocket Connected" /> : 
                              <WifiOff className="w-4 h-4 text-red-500" title="WebSocket Disconnected" />
                            }
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progres Ujian</span>
                            <span>{student.answered_questions}/{student.total_questions} ({Math.round(progressPercentage)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                progressPercentage >= 80 ? 'bg-green-500' :
                                progressPercentage >= 50 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-gray-600">
                              Pelanggaran: <span className="font-medium text-gray-900">{student.violation_count}</span>
                            </span>
                          </div>
                          {student.critical_violations > 0 && (
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">
                                Kritis: <span className="font-medium">{student.critical_violations}</span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              Waktu: <span className="font-medium text-gray-900">{formatTime(student.time_spent)}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              Aktif: <span className="font-medium text-gray-900">{new Date(student.last_activity).toLocaleTimeString()}</span>
                            </span>
                          </div>
                        </div>

                        {/* Current Question */}
                        {student.current_question !== undefined && (
                          <div className="mt-2 text-xs text-gray-500">
                            Soal saat ini: #{student.current_question + 1}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Enhanced Activity Feed */}
          <div className="lg:col-span-1 space-y-6">
            {/* Activity Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" /> Filter Aktivitas
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <select
                    value={activityFilter.type}
                    onChange={(e) => setActivityFilter(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Semua Aktivitas</option>
                    <option value="violations">Pelanggaran Saja</option>
                    <option value="activities">Aktivitas Ujian</option>
                    <option value="answers">Perubahan Jawaban</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
                  <select
                    value={activityFilter.student}
                    onChange={(e) => setActivityFilter(prev => ({ ...prev, student: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Semua Siswa</option>
                    {studentSessions.map(student => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat</label>
                  <select
                    value={activityFilter.severity}
                    onChange={(e) => setActivityFilter(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Semua Tingkat</option>
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="critical">Kritis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" /> Feed Aktivitas Live
              </h2>
              <div 
                ref={activityFeedRef}
                className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide"
              >
                {filteredActivities().length === 0 ? (
                  <div className="text-center py-4">
                    <Activity className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-xs">Tidak ada aktivitas yang sesuai filter</p>
                  </div>
                ) : (
                  filteredActivities().slice(0, 50).map((event, index) => {
                    const student = studentSessions.find(s => s.student_id === event.studentId);
                    const isViolation = event.messageType === 'violation_event';
                    
                    return (
                      <div 
                        key={`${event.timestamp}-${index}`} 
                        className={`border rounded-lg p-3 text-sm transition-all ${
                          isViolation ? 
                            event.severity === 'critical' ? 'bg-red-50 border-red-200' :
                            event.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                            event.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              isViolation ? 
                                event.severity === 'critical' ? 'text-red-900' :
                                event.severity === 'high' ? 'text-orange-900' :
                                event.severity === 'medium' ? 'text-yellow-900' :
                                'text-gray-900'
                              : 'text-blue-900'
                            }`}>
                              {student?.full_name || event.full_name || `Siswa ${event.studentId.substring(0, 6)}`}
                            </p>
                            <p className={`mt-1 ${
                              isViolation ? 
                                event.severity === 'critical' ? 'text-red-700' :
                                event.severity === 'high' ? 'text-orange-700' :
                                event.severity === 'medium' ? 'text-yellow-700' :
                                'text-gray-700'
                              : 'text-blue-700'
                            }`}>
                              {getEventTypeLabel(event.type || event.activityType || '')}
                              {(event.type === 'answer_changed' || event.activityType === 'answer_changed') && event.questionIndex !== undefined && (
                                <span className="text-xs ml-1">
                                  - Soal #{event.questionIndex + 1}
                                </span>
                              )}
                            </p>
                          </div>
                          {event.severity && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(event.severity)}`}>
                              {event.severity.toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        {/* Event Details */}
                        {event.details && (event.details.reason || event.details.message) && (
                          <p className={`text-xs mb-2 ${
                            isViolation ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {event.details.reason || event.details.message}
                          </p>
                        )}
                        
                        {/* Answer Preview for answer_changed events */}
                        {(event.type === 'answer_changed' || event.activityType === 'answer_changed') && event.newAnswer && (
                          <p className="text-xs text-blue-600 mb-2">
                            Jawaban: {typeof event.newAnswer === 'string' ? 
                              event.newAnswer.substring(0, 30) + (event.newAnswer.length > 30 ? '...' : '') : 
                              JSON.stringify(event.newAnswer).substring(0, 30) + '...'
                            }
                          </p>
                        )}
                        
                        <p className={`text-xs ${
                          isViolation ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Message Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Megaphone className="w-5 h-5 mr-2 text-blue-600" />
                Kirim Pesan ke Semua Siswa
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Pesan
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800' },
                    { value: 'warning', label: 'Peringatan', color: 'bg-yellow-100 text-yellow-800' },
                    { value: 'critical', label: 'Kritis', color: 'bg-red-100 text-red-800' }
                  ].map(type => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="radio"
                        name="messageType"
                        value={type.value}
                        checked={broadcastType === type.value}
                        onChange={(e) => setBroadcastType(e.target.value as any)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${type.color}`}>
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan Cepat
                </label>
                <div className="space-y-2">
                  {quickMessages.map((msg, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setBroadcastMessage(msg.message);
                        setBroadcastType(msg.type);
                      }}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                        msg.type === 'info' ? 'bg-blue-100 text-blue-800' :
                        msg.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {msg.type.toUpperCase()}
                      </span>
                      {msg.message}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan Kustom
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Tulis pesan untuk semua siswa..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (broadcastMessage.trim()) {
                    if (broadcastType === 'critical') {
                      if (confirm('Anda akan mengirim pesan KRITIS ke semua siswa. Lanjutkan?')) {
                        sendBroadcastMessage(broadcastMessage, broadcastType);
                        setShowBroadcastModal(false);
                        setBroadcastMessage('');
                      }
                    } else {
                      sendBroadcastMessage(broadcastMessage, broadcastType);
                      setShowBroadcastModal(false);
                      setBroadcastMessage('');
                    }
                  }
                }}
                disabled={!broadcastMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Kirim Pesan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Confirmation Modal */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Konfirmasi Penghentian Darurat
              </h3>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>PERINGATAN:</strong> Tindakan ini akan menghentikan ujian untuk SEMUA siswa secara paksa. 
                  Semua jawaban siswa akan otomatis dikumpulkan dan mereka akan diarahkan keluar dari halaman ujian.
                </p>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                Tindakan ini tidak dapat dibatalkan. Pastikan Anda benar-benar perlu menghentikan ujian secara darurat.
              </p>
              
              <p className="text-gray-600 text-xs">
                Alasan umum penghentian darurat: masalah teknis serius, keadaan darurat, atau pelanggaran berat yang memerlukan intervensi segera.
              </p>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={terminateExam}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Ya, Hentikan Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctorMonitoringPage;
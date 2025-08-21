import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { teacherExamService } from '@/services/teacherExam';
import { AlertCircle, User, Clock, Activity, Eye, CheckCircle, WifiOff, Wifi, ArrowLeft, Users, Shield, Monitor } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/constants/config';


// Definisi tipe data untuk event real-time
interface RealtimeEvent {
  messageType: string;
  type: string; // e.g., 'tab_switch', 'devtools_detected', 'session_started', 'session_ended'
  severity?: 'low' | 'medium' | 'high' | 'critical'; // Opsional, hanya untuk violation_event
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
  // Tambahan untuk status sesi
  status?: 'started' | 'ended' | 'left_page' | 'rejoined_page' | 'submitted';
  full_name?: string; // Jika backend mengirimkan nama siswa
  // Tambahan untuk aktivitas pengerjaan soal
  questionId?: string;
  newAnswer?: any;
  questionIndex?: number;
  answersCount?: number;
}

// Definisi tipe data untuk status siswa
interface StudentSessionStatus {
  student_id: string;
  session_id: string;
  full_name: string;
  status: 'online' | 'offline' | 'examming' | 'submitted'; // Status koneksi/ujian
  last_activity: number; // timestamp
  violation_count: number;
  critical_violations: number;
  ws_status: 'connecting' | 'open' | 'closed' | 'error'; // Status koneksi WebSocket
  start_time?: number;
  answers: Record<string, any>; // Menyimpan jawaban siswa per questionId
  answered_questions: number; // Jumlah soal yang sudah dijawab
  total_questions: number; // Total soal dalam ujian
}

interface ProctorMonitoringPageProps {
  examId: string;
}

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId }) => {
  const { token } = useAuth();
  const { navigate } = useRouter();

  const [examTitle, setExamTitle] = useState<string>('Memuat...');
  const [studentSessions, setStudentSessions] = useState<StudentSessionStatus[]>([]);
  const [violationEvents, setViolationEvents] = useState<RealtimeEvent[]>([]);
  const [examActivityEvents, setExamActivityEvents] = useState<RealtimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExamQuestions, setTotalExamQuestions] = useState<number>(0);
  const [connectionStats, setConnectionStats] = useState({
    total: 0,
    connected: 0,
    connecting: 0,
    disconnected: 0
  });

  // Ref untuk menyimpan instance WebSocket agar tidak hilang saat re-render
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());
  const [examDetails, setExamDetails] = useState<any>(null);

  // Fungsi untuk mengelola event dari WebSocket
  const handleWsMessage = useCallback((event: MessageEvent, sessionId: string) => {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);
      console.log(`WS message from ${sessionId}:`, data);

      // Kategorikan event berdasarkan messageType
      if (data.messageType === 'violation_event') {
        setViolationEvents(prevEvents => [data, ...prevEvents].slice(0, 50)); // Batasi 50 event pelanggaran terakhir
      } else if (data.messageType === 'exam_activity') {
        setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 50)); // Batasi 50 event aktivitas terakhir
      }

      // Perbarui status siswa berdasarkan event
      setStudentSessions(prevSessions => {
        const updatedSessions = [...prevSessions];
        const sessionIndex = updatedSessions.findIndex(s => s.session_id === sessionId);

        if (sessionIndex > -1) {
          const currentSession = updatedSessions[sessionIndex];
          currentSession.last_activity = data.timestamp;

          if (data.messageType === 'violation_event' && data.severity) {
            currentSession.violation_count += 1;
            if (data.severity === 'critical') {
              currentSession.critical_violations += 1;
            }
          } else if (data.messageType === 'session_status' && data.status) {
            // Perbarui status ujian siswa
            if (data.status === 'started' || data.status === 'rejoined_page') {
              currentSession.status = 'examming';
              // Inisialisasi answers ketika sesi dimulai
              if (data.status === 'started') {
                currentSession.answers = {};
                currentSession.answered_questions = 0;
              }
            } else if (data.status === 'left_page') {
              currentSession.status = 'offline';
            } else if (data.status === 'submitted') {
              currentSession.status = 'submitted';
            }
          } else if (data.messageType === 'student_join') {
            handleStudentJoin(data);
          } else if (data.messageType === 'student_leave') {
            handleStudentLeave(data);
          } else if (data.messageType === 'exam_activity') {
            // Handle exam activities - hitung progres pengerjaan soal
            if (data.type === 'answer_changed') {
              // Update jawaban siswa dan hitung ulang progres
              if (data.questionId && data.newAnswer !== undefined) {
                currentSession.answers[data.questionId] = data.newAnswer;
                
                // Hitung ulang jumlah soal yang sudah dijawab
                // Hitung jawaban yang tidak kosong/null/undefined
                currentSession.answered_questions = Object.values(currentSession.answers).filter(answer => 
                  answer !== null && answer !== undefined && answer !== ''
                ).length;
              }
            } else if (data.type === 'auto_save') {
              // Update answers count dari auto save jika tersedia
              if (data.answersCount !== undefined) {
                currentSession.answered_questions = Math.max(currentSession.answered_questions, data.answersCount);
              }
            }
          }
          return updatedSessions;
        }
        return prevSessions;
      });
    } catch (error) {
      console.error(`Error parsing WS message from ${sessionId}:`, error);
    }
  }, []);

  // Update connection stats
  const updateConnectionStats = useCallback(() => {
    setConnectionStats(prev => {
      const connections = Array.from(wsConnectionsRef.current.values());
      const stats = {
        total: connections.length,
        connected: connections.filter(ws => ws.readyState === WebSocket.OPEN).length,
        connecting: connections.filter(ws => ws.readyState === WebSocket.CONNECTING).length,
        disconnected: connections.filter(ws => ws.readyState === WebSocket.CLOSED).length
      };
      return stats;
    });
  }, []);

  // Handle new student joining via WebSocket
  const handleStudentJoin = useCallback((data: RealtimeEvent) => {
    setStudentSessions(prevSessions => {
      // Check if student already exists
      const existingIndex = prevSessions.findIndex(s => s.student_id === data.studentId);
      
      if (existingIndex === -1) {
        // Add new student
        const newStudent: StudentSessionStatus = {
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
          total_questions: totalExamQuestions || 0
        };
        
        // Setup WebSocket for this new student
        if (token) {
          setupWebSocketForSession(newStudent, token);
        }
        
        return [...prevSessions, newStudent];
      } else {
        // Update existing student status
        const updatedSessions = [...prevSessions];
        updatedSessions[existingIndex] = {
          ...updatedSessions[existingIndex],
          status: 'online',
          last_activity: data.timestamp,
          ws_status: 'open'
        };
        return updatedSessions;
      }
    });
  }, [totalExamQuestions, token, setupWebSocketForSession]);

  // Handle student leaving
  const handleStudentLeave = useCallback((data: RealtimeEvent) => {
    setStudentSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.student_id === data.studentId) {
          return {
            ...session,
            status: 'offline',
            last_activity: data.timestamp,
            ws_status: 'closed'
          };
        }
        return session;
      });
    });
  }, []);

  // Fungsi untuk menginisialisasi koneksi WebSocket untuk satu sesi
  const setupWebSocketForSession = useCallback((session: StudentSessionStatus, currentToken: string) => {
    if (!session.session_id || wsConnectionsRef.current.has(session.session_id)) {
      return; // Jangan buat koneksi duplikat
    }

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/exam-room/${session.session_id}?token=${currentToken}`;
    const ws = new WebSocket(wsUrl);

    wsConnectionsRef.current.set(session.session_id, ws);

    setStudentSessions(prev => prev.map(s => 
      s.session_id === session.session_id ? { ...s, ws_status: 'connecting' } : s
    ));

    ws.onopen = () => {
      console.log(`WebSocket for session ${session.session_id} connected.`);
      setStudentSessions(prev => prev.map(s => 
        s.session_id === session.session_id ? { ...s, ws_status: 'open' } : s
      ));
      updateConnectionStats();
    };

    ws.onmessage = (event) => handleWsMessage(event, session.session_id);

    ws.onclose = (event) => {
      console.log(`WebSocket for session ${session.session_id} closed:`, event.reason);
      setStudentSessions(prev => prev.map(s => 
        s.session_id === session.session_id ? { ...s, ws_status: 'closed', status: 'offline' } : s
      ));
      wsConnectionsRef.current.delete(session.session_id);
      updateConnectionStats();
    };

    ws.onerror = (error) => {
      console.error(`WebSocket for session ${session.session_id} error:`, error);
      setStudentSessions(prev => prev.map(s => 
        s.session_id === session.session_id ? { ...s, ws_status: 'error', status: 'offline' } : s
      ));
      updateConnectionStats();
    };
  }, [handleWsMessage, updateConnectionStats]);

  // Setup WebSocket connection to listen for new students joining
  const setupMainExamWebSocket = useCallback(() => {
    if (!token || !examId) return;

    const mainWsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/exam-monitor/${examId}?token=${token}`;
    const mainWs = new WebSocket(mainWsUrl);

    mainWs.onopen = () => {
      console.log('Main exam monitoring WebSocket connected');
    };

    mainWs.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);
        console.log('Main WS message:', data);
        
        if (data.messageType === 'student_join') {
          handleStudentJoin(data);
        } else if (data.messageType === 'student_leave') {
          handleStudentLeave(data);
        }
      } catch (error) {
        console.error('Error parsing main WS message:', error);
      }
    };

    mainWs.onclose = () => {
      console.log('Main exam monitoring WebSocket closed');
    };

    mainWs.onerror = (error) => {
      console.error('Main exam monitoring WebSocket error:', error);
    };

    return mainWs;
  }, [token, examId, handleStudentJoin, handleStudentLeave]);

  useEffect(() => {
    const fetchExamAndSessions = async () => {
      if (!examId || !token) {
        toast.error('ID Ujian atau token tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        // 1. Ambil detail ujian (untuk judul)
        try {
          const examDetailsResponse = await teacherExamService.getTeacherExams(token, { page: 1, limit: 100 });
          const exam = examDetailsResponse.data.find(e => e._id === examId);
          if (exam) {
            setExamTitle(exam.title);
            setExamDetails(exam);
            // Ambil total soal dari ujian
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

        // 2. Initialize empty student sessions - will be populated when students join
        setStudentSessions([]);

        // 3. Setup main WebSocket to listen for students joining/leaving
        const mainWs = setupMainExamWebSocket();

        // Store main WebSocket reference for cleanup
        if (mainWs) {
          wsConnectionsRef.current.set('main', mainWs);
        }

      } catch (error) {
        console.error('Error fetching exam details or active sessions:', error);
        toast.error('Gagal memuat detail ujian atau sesi aktif.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndSessions();

    // Cleanup: Tutup semua koneksi WebSocket saat komponen di-unmount
    return () => {
      wsConnectionsRef.current.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      });
      wsConnectionsRef.current.clear();
    };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-gray-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
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
      'auto_save': 'Auto Save',
      'mouse_leave_window': 'Mouse Keluar Window',
      'rapid_clicking': 'Klik Cepat',
      'rapid_typing': 'Ketik Cepat',
      'suspicious_key': 'Tombol Mencurigakan',
      'suspicious_combination': 'Kombinasi Tombol Mencurigakan'
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const handleBackToExams = () => {
    navigate('/teacher/exams');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.connected} Terhubung</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.connecting} Menghubungkan</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">{connectionStats.disconnected} Terputus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata Progres</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentSessions.length > 0 && totalExamQuestions > 0 ? 
                    Math.round((studentSessions.reduce((sum, s) => sum + s.answered_questions, 0) / studentSessions.length / totalExamQuestions) * 100) : 0}%
                </p>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Status Overview */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" /> Status Siswa Real-time
            </h2>
            <div className="space-y-4">
              {studentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada siswa yang terdeteksi.</p>
                </div>
              ) : (
                // Urutkan siswa berdasarkan jumlah soal yang dijawab (descending)
                studentSessions
                  .sort((a, b) => b.answered_questions - a.answered_questions)
                  .map(student => (
                  <div key={student.session_id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
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
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">
                          Progres: <span className="font-medium text-gray-900">
                            {student.answered_questions}/{student.total_questions}
                          </span>
                          {student.total_questions > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({Math.round((student.answered_questions / student.total_questions) * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-600">Pelanggaran: <span className="font-medium text-gray-900">{student.violation_count}</span></span>
                      </div>
                      {student.critical_violations > 0 && (
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">Kritis: <span className="font-medium">{student.critical_violations}</span></span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Aktif: <span className="font-medium text-gray-900">{new Date(student.last_activity).toLocaleTimeString()}</span></span>
                      </div>
                    </div>
                  </div>
                  ))
              )}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="lg:col-span-1 space-y-6">
            {/* Log Pelanggaran */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" /> Log Pelanggaran
              </h2>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {violationEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-xs">Belum ada pelanggaran</p>
                  </div>
                ) : (
                  violationEvents.map((event, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-red-900 truncate">
                            {event.full_name || studentSessions.find(s => s.student_id === event.studentId)?.full_name || `Siswa ${event.studentId.substring(0, 6)}`}
                          </p>
                          <p className="text-red-700 mt-1">
                            {getEventTypeLabel(event.type)}
                          </p>
                        </div>
                        {event.severity && (
                          <span className={`font-semibold text-xs px-2 py-1 rounded ${getSeverityColor(event.severity)} bg-opacity-20`}>
                            {event.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {event.details && (event.details.reason || event.details.message) && (
                        <p className="text-red-600 text-xs mb-2">
                          {event.details.reason || event.details.message}
                        </p>
                      )}
                      <p className="text-xs text-red-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Log Aktivitas Pengerjaan */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" /> Log Aktivitas Pengerjaan
              </h2>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {examActivityEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <Activity className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-xs">Menunggu aktivitas pengerjaan...</p>
                  </div>
                ) : (
                  examActivityEvents.map((event, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-blue-900 truncate">
                            {event.full_name || studentSessions.find(s => s.student_id === event.studentId)?.full_name || `Siswa ${event.studentId.substring(0, 6)}`}
                          </p>
                          <p className="text-blue-700 mt-1">
                            {getEventTypeLabel(event.type)}
                            {event.questionId && (
                              <span className="text-xs text-blue-600 ml-1">
                                - Soal {event.questionIndex ? event.questionIndex + 1 : 'ID: ' + event.questionId.slice(-4)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {event.type === 'answer_changed' && event.newAnswer && (
                        <p className="text-blue-600 text-xs mb-2">
                          Jawaban: {typeof event.newAnswer === 'string' ? event.newAnswer.substring(0, 50) + (event.newAnswer.length > 50 ? '...' : '') : JSON.stringify(event.newAnswer)}
                        </p>
                      )}
                      <p className="text-xs text-blue-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctorMonitoringPage;
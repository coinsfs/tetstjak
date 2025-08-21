import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { teacherExamService } from '@/services/teacherExam';
import { AlertCircle, User, Clock, Activity, Eye, CheckCircle, WifiOff, Wifi, ArrowLeft, Users, Shield, Monitor } from 'lucide-react';
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
  answers_count?: number;
}

// Mock data untuk demo - dalam implementasi nyata, ini akan datang dari API
interface MockActiveSession {
  sessionId: string;
  studentId: string;
  full_name: string;
}

interface ProctorMonitoringPageProps {
  examId?: string;
}

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId: propExamId }) => {
  const { currentPath } = useRouter();
  const examId = propExamId || currentPath.split('/').pop();
  const { token } = useAuth();
  const { navigate } = useRouter();

  const [examTitle, setExamTitle] = useState<string>('Memuat...');
  const [studentSessions, setStudentSessions] = useState<StudentSessionStatus[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStats, setConnectionStats] = useState({
    total: 0,
    connected: 0,
    connecting: 0,
    disconnected: 0
  });

  // Add error boundary
  const [error, setError] = useState<string | null>(null);

  // Ref untuk menyimpan instance WebSocket agar tidak hilang saat re-render
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());

  // Fungsi untuk mengelola event dari WebSocket
  const handleWsMessage = useCallback((event: MessageEvent, sessionId: string) => {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);
      console.log(`WS message from ${sessionId}:`, data);

      // Tambahkan event ke feed real-time
      setRealtimeEvents(prevEvents => [data, ...prevEvents].slice(0, 100)); // Batasi 100 event terakhir

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
            } else if (data.status === 'left_page') {
              currentSession.status = 'offline';
            } else if (data.status === 'submitted') {
              currentSession.status = 'submitted';
            }
          } else if (data.messageType === 'exam_activity') {
            // Handle exam activities like answer changes, navigation, etc.
            if (data.type === 'answer_changed') {
              // Update answers count if available
              currentSession.answers_count = (currentSession.answers_count || 0) + 1;
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

  // Mock function to simulate getting active exam sessions
  const getMockActiveExamSessions = useCallback((examId: string): MockActiveSession[] => {
    // In real implementation, this would be an API call
    return [
      { sessionId: '689f77431520379a7501cf80', studentId: 'student1', full_name: 'Ahmad Rizki' },
      { sessionId: '689f77431520379a7501cf81', studentId: 'student2', full_name: 'Siti Nurhaliza' },
      { sessionId: '689f77431520379a7501cf82', studentId: 'student3', full_name: 'Budi Santoso' },
      { sessionId: '689f77431520379a7501cf83', studentId: 'student4', full_name: 'Dewi Sartika' },
      { sessionId: '689f77431520379a7501cf84', studentId: 'student5', full_name: 'Eko Prasetyo' }
    ];
  }, []);

  useEffect(() => {
    const fetchExamAndSessions = async () => {
      if (!examId || !token) {
        setError('ID Ujian atau token tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching exam details for ID:', examId);
        
        // 1. Ambil detail ujian (untuk judul)
        try {
          const examDetailsResponse = await teacherExamService.getTeacherExams(token, { page: 1, limit: 100 });
          const exam = examDetailsResponse.data.find(e => e._id === examId);
          if (exam) {
            setExamTitle(exam.title);
          } else {
            setExamTitle(`Ujian ${examId.slice(-8)}`);
          }
          console.log('Exam title set:', examTitle);
        } catch (error) {
          console.warn('Could not fetch exam details, using fallback title');
          setExamTitle(`Ujian ${examId.slice(-8)}`);
        }

        // 2. Ambil daftar sesi aktif untuk ujian ini
        // Untuk demo, kita gunakan mock data
        // Dalam implementasi nyata, ini akan menjadi API call:
        // const activeSessionsResponse = await teacherExamService.getActiveExamSessions(token, examId);
        const activeSessionsResponse = getMockActiveExamSessions(examId);

        const initialStudentStatuses: StudentSessionStatus[] = activeSessionsResponse.map(s => ({
          student_id: s.studentId,
          session_id: s.sessionId,
          full_name: s.full_name,
          status: 'offline', // Default, akan diperbarui oleh WS event
          last_activity: Date.now(),
          violation_count: 0,
          critical_violations: 0,
          ws_status: 'connecting',
          start_time: Date.now(),
          answers_count: 0
        }));
        setStudentSessions(initialStudentStatuses);

        // 3. Buat koneksi WebSocket untuk setiap sesi
        initialStudentStatuses.forEach(session => {
          setupWebSocketForSession(session, token);
        });

      } catch (error) {
        console.error('Error fetching exam details or active sessions:', error);
        setError('Gagal memuat detail ujian atau sesi aktif.');
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
  }, [examId, token, setupWebSocketForSession, getMockActiveExamSessions]);

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
      'auto_save': 'Auto Save'
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
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat dashboard monitoring...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToExams}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Ujian
          </button>
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
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pelanggaran Kritis</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentSessions.reduce((sum, s) => sum + s.critical_violations, 0)}
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
                studentSessions.map(student => (
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
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">Jawaban: <span className="font-medium text-gray-900">{student.answers_count || 0}</span></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" /> Log Aktivitas Real-time
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
              {realtimeEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Menunggu aktivitas siswa...</p>
                </div>
              ) : (
                realtimeEvents.map((event, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {event.full_name || studentSessions.find(s => s.student_id === event.studentId)?.full_name || `Siswa ${event.studentId.substring(0, 6)}`}
                        </p>
                        <p className="text-gray-700 mt-1">
                          {getEventTypeLabel(event.type)}
                        </p>
                      </div>
                      {event.severity && (
                        <span className={`font-semibold text-xs px-2 py-1 rounded ${getSeverityColor(event.severity)} bg-opacity-10`}>
                          {event.severity.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {event.details && (event.details.reason || event.details.message) && (
                      <p className="text-gray-600 text-xs mb-2">
                        {event.details.reason || event.details.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
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
  );
};

export default ProctorMonitoringPage;
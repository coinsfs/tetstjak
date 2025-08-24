import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { websocketService } from '@/services/websocket';
import { 
  Users, 
  Activity, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Send, 
  StopCircle,
  ArrowLeft,
  Wifi,
  WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProctorMonitoringPageProps {
  examId: string;
}

interface ConnectedStudent {
  studentId: string;
  full_name: string;
  connectionTime: Date;
  lastActivity: Date;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspicious' | 'terminated';
  currentQuestion?: number;
  answersSubmitted?: number;
}

interface ViolationEvent {
  type: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  studentId: string;
  sessionId: string;
  details: any;
}

interface ExamActivityEvent {
  type: string;
  activityType: string;
  timestamp: number;
  studentId: string;
  sessionId: string;
  details: any;
}

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId }) => {
  const [examActivityEvents, setExamActivityEvents] = useState<ExamActivityEvent[]>([]);
  const [violationEvents, setViolationEvents] = useState<ViolationEvent[]>([]);
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([]);
  const [totalActiveStudents, setTotalActiveStudents] = useState(0);
  const [displayActivityEvents, setDisplayActivityEvents] = useState<ExamActivityEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();
  const { navigate } = useRouter();

  // Update student session based on received events
  const updateStudentSession = useCallback((eventData: any) => {
    const studentId = eventData.studentId || eventData.student_id;
    const studentName = eventData.full_name || eventData.student_name || eventData.details?.full_name || 'Unknown Student';
    
    if (!studentId) return;

    setConnectedStudents(prevStudents => {
      const existingIndex = prevStudents.findIndex(s => s.studentId === studentId);
      
      if (existingIndex >= 0) {
        // Update existing student
        const updatedStudents = [...prevStudents];
        const student = updatedStudents[existingIndex];
        
        updatedStudents[existingIndex] = {
          ...student,
          lastActivity: new Date(),
          violationCount: eventData.type === 'violation_event' ? student.violationCount + 1 : student.violationCount,
          status: eventData.severity === 'critical' ? 'suspicious' : student.status,
          currentQuestion: eventData.details?.currentQuestionIndex !== undefined ? eventData.details.currentQuestionIndex + 1 : student.currentQuestion,
          answersSubmitted: eventData.details?.totalAnswered !== undefined ? eventData.details.totalAnswered : student.answersSubmitted
        };
        
        return updatedStudents;
      } else {
        // Add new student if not present
        return [...prevStudents, {
          studentId,
          full_name: studentName,
          connectionTime: new Date(),
          lastActivity: new Date(),
          violationCount: eventData.type === 'violation_event' ? 1 : 0,
          status: 'active',
          currentQuestion: eventData.details?.currentQuestionIndex !== undefined ? eventData.details.currentQuestionIndex + 1 : 0,
          answersSubmitted: eventData.details?.totalAnswered !== undefined ? eventData.details.totalAnswered : 0
        }];
      }
    });
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && notificationSoundRef.current) {
      notificationSoundRef.current.play().catch(console.error);
    }
  }, [soundEnabled]);

  // Setup WebSocket message handlers
  const setupMessageHandlers = useCallback(() => {
    websocketService.onMessage('violation_event', (data: any) => {
      console.log('VIOLATION HANDLER CALLED:', new Date().toISOString());

      // Enhanced violation event handling with better data extraction
      const enhancedData = {
        ...data,
        full_name: data.details?.full_name || data.student_name || data.full_name || 'Unknown Student',
        timestamp: data.timestamp || Date.now()
      };
      
      setViolationEvents(prevEvents => [enhancedData, ...prevEvents].slice(0, 100));
      if (data.severity === 'critical') {
        playNotificationSound();
      }
      updateStudentSession(enhancedData);
    });

    websocketService.onMessage('activity_event', (data: any) => {
      console.log('ACTIVITY HANDLER CALLED:', new Date().toISOString());

      setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      
      // Add to display activity events (filter out heartbeat to reduce noise)
      if (data.activityType !== 'heartbeat') {
        setDisplayActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 20));
      }
      
      updateStudentSession(data);
    });

    websocketService.onMessage('presence_update', (data: any) => {
      // Update total active students count from presence_update message
      if (data.student_count !== undefined) {
        setTotalActiveStudents(data.student_count);
      }
      
      if (data.users && Array.isArray(data.users)) {
        setConnectedStudents(data.users.map((user: any) => ({
          studentId: user.id || user.studentId,
          full_name: user.full_name || 'Unknown Student',
          connectionTime: new Date(user.connectionTime || Date.now()),
          lastActivity: new Date(user.lastActivity || Date.now()),
          violationCount: user.violationCount || 0,
          status: user.status || 'active',
          currentQuestion: user.currentQuestion || 0,
          answersSubmitted: user.answersSubmitted || 0
        })));
      }
    });

    // Handle student connection events
    websocketService.onMessage('student_connected', (data: any) => {
      const studentId = data.studentId || data.student_id;
      const studentName = data.full_name || data.student_name || 'Unknown Student';
      
      if (studentId) {
        setConnectedStudents(prevStudents => {
          const exists = prevStudents.some(s => s.studentId === studentId);
          if (!exists) {
            return [...prevStudents, {
              studentId,
              full_name: studentName,
              connectionTime: new Date(),
              lastActivity: new Date(),
              violationCount: 0,
              status: 'active',
              currentQuestion: 0,
              answersSubmitted: 0
            }];
          }
          return prevStudents;
        });
      }
    });

    // Handle student disconnection events
    websocketService.onMessage('student_disconnected', (data: any) => {
      const studentId = data.studentId || data.student_id;
      
      if (studentId) {
        // Immediately remove disconnected student from the list
        setConnectedStudents(prevStudents => 
          prevStudents.filter(student => student.studentId !== studentId)
        );
        
        console.log(`Student ${studentId} disconnected and removed from monitoring list`);
      }
    });

  }, [updateStudentSession, playNotificationSound]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!examId || !token) return;
    
    const onAuthError = () => {
      toast.error('Authentication failed');
      navigate('/login');
    };

    const onStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
      setConnectionStatus(status);
      if (status === 'connected') {
        setLastHeartbeat(new Date());
        toast.success('Terhubung ke sistem monitoring');
      } else if (status === 'error') {
        toast.error('Error koneksi monitoring');
      } else if (status === 'disconnected') {
        toast.error('Koneksi monitoring terputus');
      }
    };

    // Use same endpoint as students
    websocketService.connect(token, `/ws/exam-room/${examId}`, onAuthError, onStatusChange);
    
    // Set generic handler to log all messages
    websocketService.setGenericHandler((data) => {
      console.log('WebSocket Message:', data);
    });
    
    setupMessageHandlers();
    
    return () => {
      websocketService.offMessage('violation_event');
      websocketService.offMessage('activity_event');
      websocketService.offMessage('presence_update');
      websocketService.offMessage('student_connected');
      websocketService.offMessage('student_disconnected');
      websocketService.setGenericHandler(null); // Clear generic handler on unmount
    };
  }, [examId, token, setupMessageHandlers, navigate]);

  // Client-side ping to keep connection alive during idle periods
  useEffect(() => {
    if (!examId || !token) return;

    // Send ping every 20 seconds to keep connection alive
    pingIntervalRef.current = setInterval(() => {
      websocketService.send({
        type: 'proctor_ping',
        examId: examId,
        timestamp: Date.now(),
        message: 'keep-alive'
      });
      
      setLastHeartbeat(new Date());
    }, 20000); // 20 seconds

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [examId, token]);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  }, []);

  // Send broadcast message to all students
  const sendBroadcastMessage = useCallback((message: string, type: 'info' | 'warning' | 'critical' = 'info') => {
    const broadcastData = {
      type: 'proctor_message',
      message,
      messageType: type,
      timestamp: new Date().toISOString(),
      examId: examId
    };
    
    websocketService.send(broadcastData);
    toast.success('Pesan berhasil dikirim ke semua siswa');
  }, [examId]);

  // Terminate exam for a specific student or all students
  const terminateExam = useCallback((studentId?: string) => {
    const terminationData = {
      type: 'terminate_exam',
      studentId: studentId || 'all',
      reason: 'Terminated by proctor',
      timestamp: new Date().toISOString(),
      examId: examId
    };
    
    websocketService.send(terminationData);
    const message = studentId ? 'Ujian siswa berhasil dihentikan' : 'Ujian semua siswa berhasil dihentikan';
    toast.success(message);
  }, [examId]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | number) => {
    // Enhanced timestamp formatting with validation
    let dateValue: Date;
    
    if (typeof timestamp === 'number') {
      // Handle numeric timestamp
      dateValue = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Handle string timestamp
      dateValue = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(dateValue.getTime())) {
      return 'Invalid Date';
    }
    
    return dateValue.toLocaleTimeString('id-ID');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'suspicious': return 'text-red-600 bg-red-100';
      case 'terminated': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get violation severity color
  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

// Ganti functions ini dengan versi yang di-memoize:

const getViolationDescription = useCallback((violation: ViolationEvent) => {
  // Safe destructuring with fallback values
  const { violation_type, details = {} } = violation;
  
  // Handle undefined/null violation_type - try to infer from details
  if (!violation_type || typeof violation_type !== 'string') {
    // Jangan pakai console.warn di sini - ganti dengan console.debug atau hapus
    console.debug('Missing violation_type, trying to infer from details:', violation);
    
    // Try to infer violation type from details
    if (details.visibilityState === 'hidden') {
      return 'Menyembunyikan halaman ujian (Alt+Tab atau minimize)';
    }
    if (details.tabActive === false) {
      return 'Pindah tab dari halaman ujian';
    }
    
    // Default fallback
    return 'Aktivitas mencurigakan terdeteksi';
  }
  
  switch (violation_type) {
    case 'tab_switch_return':
      const inactiveTime = details?.inactiveTime ? Math.round(details.inactiveTime / 1000) : 0;
      const switchCount = details?.switchCount || 0;
      return `Kembali ke tab ujian setelah ${inactiveTime} detik (${switchCount} kali pindah tab)`;
    
    case 'suspicious_key':
      const key = details?.key || 'Unknown';
      return `Menekan tombol mencurigakan: ${key}`;
    
    case 'suspicious_combination':
      const combination = details?.combination || 'Unknown';
      return `Menggunakan kombinasi tombol: ${combination}`;
    
    case 'devtools_detected':
      const score = details?.score || 0;
      return `Developer Tools terdeteksi (confidence: ${score}%)`;
    
    case 'screen_height_reduction':
      const reductionPercentage = details?.reductionPercentage || 0;
      return `Pengurangan tinggi layar ${reductionPercentage}% (kemungkinan split screen)`;
    
    case 'right_click_attempt':
      return 'Mencoba klik kanan pada halaman ujian';
    
    case 'copy_attempt':
      return 'Mencoba menyalin teks dari halaman ujian';
    
    case 'paste_attempt':
      return 'Mencoba menempel teks ke halaman ujian';
    
    case 'cut_attempt':
      return 'Mencoba memotong teks dari halaman ujian';
    
    case 'fullscreen_exit':
      return 'Keluar dari mode fullscreen';
    
    case 'page_hidden':
      return 'Menyembunyikan halaman ujian (Alt+Tab atau minimize)';
    
    case 'rapid_clicking':
      const clickCount = details?.clickCount || 0;
      return `Klik terlalu cepat (${clickCount} klik dalam waktu singkat)`;
    
    case 'rapid_typing':
      const keystrokeCount = details?.keystrokeCount || 0;
      return `Mengetik terlalu cepat (${keystrokeCount} keystroke)`;
    
    default:
      // Safe string manipulation with null checks
      try {
        return violation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } catch (error) {
        console.error('Error formatting violation_type:', error, violation_type);
        return `Pelanggaran: ${violation_type}`;
      }
  }
}, []); // Empty dependency array karena function ini pure

const getActivityDescription = useCallback((activity: ExamActivityEvent) => {
  const { activityType, details = {} } = activity;
  const studentName = details?.full_name || activity.student_name || 'Siswa';
  
  // Handle undefined/null activityType
  if (!activityType || typeof activityType !== 'string') {
    // Jangan pakai console.warn - ganti dengan console.debug atau hapus
    console.debug('Missing activityType, using fallback:', activity);
    
    // Try to infer activity from details or use generic message
    if (details.timestamp) {
      return `${studentName} melakukan aktivitas pada ujian`;
    }
    return `${studentName} aktif dalam ujian`;
  }
  
  switch (activityType) {
    case 'answer_start':
      const questionPos = details?.questionPosition || details?.currentQuestionIndex + 1 || 'Unknown';
      return `${studentName} mulai menjawab soal ${questionPos}`;
    
    case 'answer_submitted':
      const submitQuestionPos = details?.questionPosition || details?.currentQuestionIndex + 1 || 'Unknown';
      return `${studentName} mengirim jawaban soal ${submitQuestionPos}`;
    
    case 'answer_modified':
      const modifyQuestionPos = details?.questionPosition || details?.currentQuestionIndex + 1 || 'Unknown';
      return `${studentName} mengubah jawaban soal ${modifyQuestionPos}`;
    
    case 'question_viewed':
      const viewQuestionPos = details?.questionPosition || details?.currentQuestionIndex + 1 || 'Unknown';
      return `${studentName} melihat soal ${viewQuestionPos}`;
    
    case 'auto_save':
      const answersCount = details?.answersCount || 0;
      return `${studentName} otomatis menyimpan ${answersCount} jawaban`;
    
    case 'fullscreen_exit':
      return `${studentName} keluar dari mode fullscreen`;
    
    case 'screen_resize':
      const reductionPercentage = details?.reductionPercentage || 0;
      return `${studentName} mengubah ukuran layar (${reductionPercentage}% pengurangan)`;
    
    case 'question_time_spent':
      const timeSpent = details?.timeSpent ? Math.round(details.timeSpent / 1000) : 0;
      const questionPosition = details?.questionPosition || 'Unknown';
      return `${studentName} menghabiskan ${timeSpent} detik pada soal ${questionPosition}`;
    
    default:
      // Safe string manipulation with null checks
      try {
        return `${studentName} melakukan ${activityType.replace(/_/g, ' ')}`;
      } catch (error) {
        console.error('Error formatting activityType:', error, activityType);
        return `${studentName} melakukan aktivitas: ${activityType}`;
      }
  }
}, []); // Empty dependency array karena function ini pure

  // Tambahkan ini sebelum return statement
  const memoizedViolationEvents = useMemo(() => violationEvents, [violationEvents]);
  const memoizedDisplayActivityEvents = useMemo(() => displayActivityEvents, [displayActivityEvents]);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Monitoring Ujian</h1>
                  <p className="text-gray-600">ID Ujian: {examId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
              
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Terhubung</p>
                <p className="text-2xl font-bold text-gray-900">{totalActiveStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Detail: {connectedStudents.length} siswa</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pelanggaran</p>
                <p className="text-2xl font-bold text-gray-900">{violationEvents.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktivitas</p>
                <p className="text-2xl font-bold text-gray-900">{examActivityEvents.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heartbeat Terakhir</p>
                <p className="text-sm font-medium text-gray-900">{formatTimestamp(lastHeartbeat.getTime())}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Siswa Terhubung</h3>
              <p className="text-sm text-gray-500 mt-1">Total aktif: {totalActiveStudents} siswa</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {connectedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada siswa yang terhubung</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedStudents.map((student) => (
                    <div key={student.studentId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{student.full_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Soal: {student.currentQuestion || 0}</div>
                        <div>Jawaban: {student.answersSubmitted || 0}</div>
                        <div>Pelanggaran: {student.violationCount}</div>
                        <div>Terakhir aktif: {formatTimestamp(student.lastActivity.getTime())}</div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => terminateExam(student.studentId)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <StopCircle className="w-3 h-3" />
                          <span>Hentikan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Violations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pelanggaran Terbaru</h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {violationEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada pelanggaran</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memoizedViolationEvents.map((violation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getViolationColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(violation.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {getViolationDescription(violation)}
                      </p>
                      <p className="text-xs text-gray-600">Siswa: {violation.full_name || violation.details?.full_name || 'Unknown Student'}</p>
                      {violation.details && Object.keys(violation.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Detail teknis
                          </summary>
                          <div className="mt-1 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(violation.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Activities */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Aktivitas Siswa Terbaru</h3>
            <p className="text-sm text-gray-500 mt-1">Aktivitas normal siswa selama ujian</p>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {memoizedDisplayActivityEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada aktivitas siswa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayActivityEvents.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {getActivityDescription(activity)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                      {activity.details && Object.keys(activity.details).filter(key => 
                        !['full_name', 'timestamp', 'studentId', 'examId', 'sessionId'].includes(key)
                      ).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                            Detail aktivitas
                          </summary>
                          <div className="mt-1 text-xs text-gray-400 bg-white p-2 rounded border">
                            {Object.entries(activity.details)
                              .filter(([key]) => !['full_name', 'timestamp', 'studentId', 'examId', 'sessionId'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium">{key}:</span>
                                  <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </div>
                              ))
                            }
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Broadcast Controls */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontrol Ujian</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => sendBroadcastMessage('Peringatan: Tetap fokus pada ujian Anda', 'warning')}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Peringatan</span>
            </button>
            
            <button
              onClick={() => terminateExam()}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              <span>Hentikan Semua Ujian</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctorMonitoringPage;
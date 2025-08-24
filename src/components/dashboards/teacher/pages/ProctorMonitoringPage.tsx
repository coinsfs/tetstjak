import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { token } = useAuth();
  const { navigate } = useRouter();

  // Update student session based on received events
  const updateStudentSession = useCallback((eventData: any) => {
    const studentId = eventData.studentId || eventData.student_id;
    const studentName = eventData.student_name || eventData.details?.full_name || 'Unknown Student';
    
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
          currentQuestion: eventData.details?.questionPosition || student.currentQuestion,
          answersSubmitted: eventData.details?.answersCount || student.answersSubmitted
        };
        
        return updatedStudents;
      } else {
        // Add new student
        return [...prevStudents, {
          studentId,
          full_name: studentName,
          connectionTime: new Date(),
          lastActivity: new Date(),
          violationCount: eventData.type === 'violation_event' ? 1 : 0,
          status: 'active',
          currentQuestion: eventData.details?.questionPosition || 0,
          answersSubmitted: eventData.details?.answersCount || 0
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
      setViolationEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      if (data.severity === 'critical') {
        playNotificationSound();
      }
      updateStudentSession(data);
    });

    websocketService.onMessage('activity_event', (data: any) => {
      setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      updateStudentSession(data);
    });

    websocketService.onMessage('presence_update', (data: any) => {
      // Handle presence updates if needed
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
    
    setupMessageHandlers();
    
    return () => {
      websocketService.offMessage('violation_event');
      websocketService.offMessage('activity_event');
      websocketService.offMessage('presence_update');
    };
  }, [examId, token, setupMessageHandlers, navigate]);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate some connected students
    const mockStudents: ConnectedStudent[] = [
      {
        studentId: 'student1',
        full_name: 'Ahmad Rizki',
        connectionTime: new Date(Date.now() - 300000),
        lastActivity: new Date(Date.now() - 30000),
        violationCount: 2,
        status: 'active',
        currentQuestion: 5,
        answersSubmitted: 4
      },
      {
        studentId: 'student2',
        full_name: 'Siti Nurhaliza',
        connectionTime: new Date(Date.now() - 250000),
        lastActivity: new Date(Date.now() - 10000),
        violationCount: 0,
        status: 'active',
        currentQuestion: 3,
        answersSubmitted: 3
      }
    ];
    
    setConnectedStudents(mockStudents);
  }, []);

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
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
    return date.toLocaleTimeString('id-ID');
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
                <p className="text-2xl font-bold text-gray-900">{connectedStudents.length}</p>
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
                  {violationEvents.map((violation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getViolationColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(violation.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{violation.violation_type}</p>
                      <p className="text-xs text-gray-600">Siswa: {violation.details?.full_name || 'Unknown'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
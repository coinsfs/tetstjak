import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/hooks/useRouter';
import { websocketService } from '@/services/websocket';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Shield, 
  Wifi, 
  WifiOff,
  User,
  Monitor,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ConnectedStudent {
  studentId: string;
  full_name: string;
  sessionId: string;
  connectionStatus: 'connected' | 'disconnected' | 'unstable';
  lastSeen: number;
  currentQuestionIndex?: number;
  totalAnswered?: number;
  timeRemaining?: number;
  violationCount?: number;
  isActivelyWorking?: boolean;
  deviceInfo?: {
    userAgent?: string;
    screenResolution?: { width: number; height: number };
    timezone?: string;
  };
}

interface StudentActivity {
  studentId: string;
  full_name: string;
  sessionId: string;
  eventType: string;
  timestamp: number;
  details: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface ViolationEvent {
  studentId: string;
  full_name: string;
  sessionId: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  details: any;
}

interface ProctorMonitoringPageProps {
  examId: string;
}

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId }) => {
  const { token, user } = useAuth();
  const { navigate } = useRouter();
  
  // State for connected students (real-time from WebSocket)
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  
  // UI State
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'violations' | 'activities'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Refs for auto-scroll
  const activitiesEndRef = useRef<HTMLDivElement>(null);
  const lastActivityCountRef = useRef(0);

  // WebSocket connection and message handling
  useEffect(() => {
    if (!token || !examId) return;

    // Monitor WebSocket connection status
    const checkConnectionStatus = () => {
      const isConnected = websocketService.isConnected();
      setWsConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkConnectionStatus();
    const statusInterval = setInterval(checkConnectionStatus, 5000);

    // Handle student connection updates
    const handleStudentConnectionUpdate = (data: any) => {
      if (data.type === 'exam_students_update' && data.examId === examId) {
        console.log('Received student connection update:', data);
        
        const students: ConnectedStudent[] = data.students.map((student: any) => ({
          studentId: student.studentId,
          full_name: student.full_name,
          sessionId: student.sessionId,
          connectionStatus: student.connectionStatus || 'connected',
          lastSeen: student.lastSeen || Date.now(),
          currentQuestionIndex: student.currentQuestionIndex,
          totalAnswered: student.totalAnswered,
          timeRemaining: student.timeRemaining,
          violationCount: student.violationCount || 0,
          isActivelyWorking: student.isActivelyWorking || false,
          deviceInfo: student.deviceInfo
        }));
        
        setConnectedStudents(students);
      }
    };

    // Handle student activity events (excluding heartbeat)
    const handleStudentActivity = (data: any) => {
      if (data.type === 'activity_event' && 
          data.examId === examId && 
          data.details?.eventType && 
          data.details.eventType !== 'heartbeat') {
        
        console.log('Received student activity:', data);
        
        const activity: StudentActivity = {
          studentId: data.studentId,
          full_name: data.details.full_name || 'Unknown Student',
          sessionId: data.sessionId,
          eventType: data.details.eventType,
          timestamp: data.timestamp,
          details: data.details
        };
        
        setStudentActivities(prev => {
          const newActivities = [activity, ...prev.slice(0, 99)]; // Keep last 100 activities
          return newActivities;
        });

        // Update student's active working status
        if (['answer_update', 'question_time_spent'].includes(data.details.eventType)) {
          setConnectedStudents(prev => prev.map(student => 
            student.studentId === data.studentId 
              ? { ...student, isActivelyWorking: true, lastSeen: data.timestamp }
              : student
          ));
        }
      }
    };

    // Handle violation events
    const handleViolationEvent = (data: any) => {
      if (data.type === 'violation_event' && data.examId === examId) {
        console.log('Received violation event:', data);
        
        const violation: ViolationEvent = {
          studentId: data.studentId,
          full_name: data.details.full_name || 'Unknown Student',
          sessionId: data.sessionId,
          violation_type: data.violation_type,
          severity: data.severity,
          timestamp: data.timestamp,
          details: data.details
        };
        
        setViolations(prev => {
          const newViolations = [violation, ...prev.slice(0, 99)]; // Keep last 100 violations
          return newViolations;
        });

        // Update student's violation count
        setConnectedStudents(prev => prev.map(student => 
          student.studentId === data.studentId 
            ? { ...student, violationCount: (student.violationCount || 0) + 1 }
            : student
        ));

        // Show toast for critical violations
        if (data.severity === 'critical') {
          toast.error(`Critical violation: ${violation.full_name} - ${data.violation_type}`);
        }
      }
    };

    // Handle heartbeat for connection status (but don't show as activity)
    const handleHeartbeat = (data: any) => {
      if (data.type === 'activity_event' && 
          data.examId === examId && 
          data.details?.eventType === 'heartbeat') {
        
        // Update student's last seen and connection info, but don't add to activities
        setConnectedStudents(prev => prev.map(student => 
          student.studentId === data.studentId 
            ? { 
                ...student, 
                lastSeen: data.timestamp,
                currentQuestionIndex: data.details.currentQuestionIndex,
                totalAnswered: data.details.totalAnswered,
                timeRemaining: data.details.timeRemaining,
                connectionStatus: 'connected'
              }
            : student
        ));
      }
    };

    // Register WebSocket message handlers
    websocketService.onMessage('exam_students_update', handleStudentConnectionUpdate);
    websocketService.onMessage('activity_event', handleStudentActivity);
    websocketService.onMessage('activity_event', handleHeartbeat); // Same type but different handler
    websocketService.onMessage('violation_event', handleViolationEvent);

    // Request initial student list
    websocketService.send({
      type: 'request_exam_students',
      examId: examId,
      requesterId: user?._id
    });

    return () => {
      clearInterval(statusInterval);
      websocketService.offMessage('exam_students_update');
      websocketService.offMessage('activity_event');
      websocketService.offMessage('violation_event');
    };
  }, [token, examId, user?._id]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    const currentActivityCount = studentActivities.length + violations.length;
    if (currentActivityCount > lastActivityCountRef.current) {
      activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastActivityCountRef.current = currentActivityCount;
    }
  }, [studentActivities.length, violations.length]);

  // Filter activities based on search and filter type
  const filteredActivities = React.useMemo(() => {
    let combined: (StudentActivity | ViolationEvent)[] = [];
    
    if (activityFilter === 'all' || activityFilter === 'activities') {
      combined = [...combined, ...studentActivities];
    }
    
    if (activityFilter === 'all' || activityFilter === 'violations') {
      combined = [...combined, ...violations.map(v => ({ ...v, eventType: v.violation_type }))];
    }
    
    // Sort by timestamp (newest first)
    combined.sort((a, b) => b.timestamp - a.timestamp);
    
    // Filter by search query
    if (searchQuery) {
      combined = combined.filter(item => 
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.eventType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by selected student
    if (selectedStudent) {
      combined = combined.filter(item => item.studentId === selectedStudent);
    }
    
    return combined.slice(0, 50); // Limit to 50 items for performance
  }, [studentActivities, violations, activityFilter, searchQuery, selectedStudent]);

  // Filter connected students by search
  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) return connectedStudents;
    
    return connectedStudents.filter(student =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [connectedStudents, searchQuery]);

  const handleBackToExams = () => {
    navigate('/teacher/exams');
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'unstable':
        return <WifiOff className="w-4 h-4 text-yellow-600" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getViolationSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActivityTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'answer_update':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'question_time_spent':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'student_joined_exam':
        return <User className="w-4 h-4 text-green-600" />;
      default:
        if (eventType.includes('violation') || eventType.includes('suspicious')) {
          return <AlertTriangle className="w-4 h-4 text-red-600" />;
        }
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatEventType = (eventType: string) => {
    const eventTypeMap: { [key: string]: string } = {
      'answer_update': 'Jawaban Diperbarui',
      'question_time_spent': 'Waktu di Soal',
      'student_joined_exam': 'Bergabung ke Ujian',
      'tab_switch': 'Pindah Tab',
      'fullscreen_exit': 'Keluar Fullscreen',
      'copy_attempt': 'Percobaan Copy',
      'paste_attempt': 'Percobaan Paste',
      'devtools_detected': 'DevTools Terdeteksi',
      'right_click_attempt': 'Klik Kanan',
      'suspicious_key': 'Tombol Mencurigakan'
    };
    
    return eventTypeMap[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToExams}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali ke Ujian</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Monitoring Ujian</h1>
                <p className="text-sm text-gray-500">ID Ujian: {examId}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* WebSocket Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              wsConnectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {wsConnectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{wsConnectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}</span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{connectedStudents.length} Siswa</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>{studentActivities.length} Aktivitas</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{violations.length} Pelanggaran</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connected Students Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Siswa Terhubung</h2>
                  <span className="text-sm text-gray-500">{connectedStudents.length} siswa</span>
                </div>
              </div>
              
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                {/* Students List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.studentId}
                      onClick={() => setSelectedStudent(
                        selectedStudent === student.studentId ? null : student.studentId
                      )}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudent === student.studentId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getConnectionStatusIcon(student.connectionStatus)}
                          <span className="font-medium text-gray-900 text-sm">
                            {student.full_name}
                          </span>
                        </div>
                        {student.isActivelyWorking && (
                          <Zap className="w-4 h-4 text-green-500" title="Sedang aktif mengerjakan" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Soal: {student.currentQuestionIndex || 0}</div>
                        <div>Dijawab: {student.totalAnswered || 0}</div>
                        <div>Pelanggaran: {student.violationCount || 0}</div>
                        <div>Terakhir: {formatTimestamp(student.lastSeen)}</div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Tidak ada siswa terhubung</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Log Aktivitas</h2>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value as any)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Semua</option>
                      <option value="activities">Aktivitas Saja</option>
                      <option value="violations">Pelanggaran Saja</option>
                    </select>
                  </div>
                  
                  {selectedStudent && (
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Hapus Filter Siswa</span>
                    </button>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredActivities.map((activity, index) => {
                      const isViolation = 'violation_type' in activity;
                      
                      return (
                        <div
                          key={`${activity.studentId}-${activity.timestamp}-${index}`}
                          className={`p-3 rounded-lg border ${
                            isViolation 
                              ? getViolationSeverityColor((activity as ViolationEvent).severity)
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getActivityTypeIcon(activity.eventType)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {activity.full_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(activity.timestamp)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-700">
                                  {formatEventType(activity.eventType)}
                                </div>
                                {activity.details && Object.keys(activity.details).length > 0 && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    {isViolation ? (
                                      <span>Tingkat: {(activity as ViolationEvent).severity}</span>
                                    ) : (
                                      <>
                                        {activity.details.questionPosition && (
                                          <span>Soal #{activity.details.questionPosition} • </span>
                                        )}
                                        {activity.details.timeSpent && (
                                          <span>Waktu: {Math.round(activity.details.timeSpent / 1000)}s</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {isViolation && (
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                getViolationSeverityColor((activity as ViolationEvent).severity)
                              }`}>
                                {(activity as ViolationEvent).severity.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredActivities.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Belum ada aktivitas</p>
                      </div>
                    )}
                    
                    <div ref={activitiesEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctorMonitoringPage;
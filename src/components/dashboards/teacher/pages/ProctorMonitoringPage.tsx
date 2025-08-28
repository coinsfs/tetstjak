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
  WifiOff,
  Monitor,
  FileText,
  ChevronUp,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  BarChart3
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
  answersSubmitted: number;
  answeredQuestionsSet: Set<string>; // Track unique questions answered
  
  // Enhanced properties for better monitoring
  latestActivityDescription?: string;
  latestActivityTimestamp?: Date;
  latestViolationDescription?: string;
  latestViolationTimestamp?: Date;
  screenStatus: 'normal' | 'reduced' | 'very_small';
  originalScreenHeight?: number;
  currentScreenHeight?: number;
  screenReductionPercentage?: number;
  violationsBySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
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

type SortField = 'full_name' | 'violationCount' | 'lastActivity' | 'progress' | 'answersSubmitted';
type SortDirection = 'asc' | 'desc';

const ProctorMonitoringPage: React.FC<ProctorMonitoringPageProps> = ({ examId }) => {
  const [examActivityEvents, setExamActivityEvents] = useState<ExamActivityEvent[]>([]);
  const [violationEvents, setViolationEvents] = useState<ViolationEvent[]>([]);
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([]);
  const [totalActiveStudents, setTotalActiveStudents] = useState(0);
  const [totalExamQuestions, setTotalExamQuestions] = useState<number>(0);
  const [displayActivityEvents, setDisplayActivityEvents] = useState<ExamActivityEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [selectedStudent, setSelectedStudent] = useState<ConnectedStudent | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('violationCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();
  const { navigate } = useRouter();

  // Keep soundEnabledRef in sync with soundEnabled state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Get total questions from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const totalQuestionsParam = urlParams.get('totalQuestions');
    if (totalQuestionsParam) {
      setTotalExamQuestions(parseInt(totalQuestionsParam, 10));
    }
  }, []);

  // Load connected students from localStorage on mount
  useEffect(() => {
    const savedStudents = localStorage.getItem(`monitoring_students_${examId}`);
    if (savedStudents) {
      try {
        const parsedStudents = JSON.parse(savedStudents);
        // Convert answeredQuestionsSet from array back to Set
        const studentsWithSets = parsedStudents.map((student: any) => ({
          ...student,
          connectionTime: new Date(student.connectionTime),
          lastActivity: new Date(student.lastActivity),
          latestActivityTimestamp: student.latestActivityTimestamp ? new Date(student.latestActivityTimestamp) : undefined,
          latestViolationTimestamp: student.latestViolationTimestamp ? new Date(student.latestViolationTimestamp) : undefined,
          answeredQuestionsSet: new Set(student.answeredQuestionsArray || [])
        }));
        setConnectedStudents(studentsWithSets);
        console.log('Loaded students from localStorage:', studentsWithSets.length);
      } catch (error) {
        console.error('Error loading students from localStorage:', error);
      }
    }
  }, [examId]);

  // Save connected students to localStorage whenever it changes
  useEffect(() => {
    if (connectedStudents.length > 0) {
      try {
        // Convert Set to array for JSON serialization
        const studentsForStorage = connectedStudents.map(student => ({
          ...student,
          answeredQuestionsArray: Array.from(student.answeredQuestionsSet)
        }));
        localStorage.setItem(`monitoring_students_${examId}`, JSON.stringify(studentsForStorage));
        console.log('Saved students to localStorage:', connectedStudents.length);
      } catch (error) {
        console.error('Error saving students to localStorage:', error);
      }
    }
  }, [connectedStudents, examId]);

  // Enhanced student session update with detailed tracking
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
        
        // Prepare updated student data
        const updatedStudent: ConnectedStudent = {
          ...student,
          lastActivity: new Date(),
        };

        // Handle violation events
        if (eventData.type === 'violation_event') {
          updatedStudent.violationCount = student.violationCount + 1;
          updatedStudent.violationsBySeverity = {
            ...student.violationsBySeverity,
            [eventData.severity]: (student.violationsBySeverity[eventData.severity] || 0) + 1
          };
          updatedStudent.latestViolationDescription = getViolationDescription(eventData);
          updatedStudent.latestViolationTimestamp = new Date(eventData.timestamp);
          
          // Update status based on severity
          if (eventData.severity === 'critical') {
            updatedStudent.status = 'suspicious';
          }
          
          // Handle screen-related violations
          if (eventData.violation_type === 'screen_height_reduction' && eventData.details) {
            updatedStudent.originalScreenHeight = eventData.details.originalHeight;
            updatedStudent.currentScreenHeight = eventData.details.currentHeight;
            updatedStudent.screenReductionPercentage = eventData.details.reductionPercentage;
            
            if (eventData.details.reductionPercentage > 50) {
              updatedStudent.screenStatus = 'very_small';
            } else if (eventData.details.reductionPercentage > 20) {
              updatedStudent.screenStatus = 'reduced';
            }
          }
        }
        
        // Handle activity events - IMPROVED LOGIC
        if (eventData.type === 'activity_event') {
          updatedStudent.latestActivityDescription = getActivityDescription(eventData);
          updatedStudent.latestActivityTimestamp = new Date(eventData.timestamp);
          
          // Handle answer updates - only count unique questions
          if (eventData.details?.eventType === 'answer_update' && eventData.details?.questionId) {
            const questionId = eventData.details.questionId;
            
            // Add to answered questions set if not already present
            if (!student.answeredQuestionsSet.has(questionId)) {
              updatedStudent.answeredQuestionsSet = new Set([...student.answeredQuestionsSet, questionId]);
              updatedStudent.answersSubmitted = updatedStudent.answeredQuestionsSet.size;
            }
          }
        }
        
        updatedStudents[existingIndex] = updatedStudent;
        return updatedStudents;
      } else {
        // Add new student with enhanced properties
        const newStudent: ConnectedStudent = {
          studentId,
          full_name: studentName,
          connectionTime: new Date(),
          lastActivity: new Date(),
          violationCount: eventData.type === 'violation_event' ? 1 : 0,
          status: 'active',
          answersSubmitted: 0,
          answeredQuestionsSet: new Set<string>(),
          screenStatus: 'normal',
          violationsBySeverity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          }
        };
        
        // Set initial violation data if this is a violation event
        if (eventData.type === 'violation_event') {
          newStudent.violationsBySeverity[eventData.severity] = 1;
          newStudent.latestViolationDescription = getViolationDescription(eventData);
          newStudent.latestViolationTimestamp = new Date(eventData.timestamp);
        }
        
        // Set initial activity data if this is an activity event
        if (eventData.type === 'activity_event') {
          newStudent.latestActivityDescription = getActivityDescription(eventData);
          newStudent.latestActivityTimestamp = new Date(eventData.timestamp);
          
          // Handle initial answer update
          if (eventData.details?.eventType === 'answer_update' && eventData.details?.questionId) {
            const questionId = eventData.details.questionId;
            newStudent.answeredQuestionsSet = new Set([questionId]);
            newStudent.answersSubmitted = 1;
          }
        }
        
        return [...prevStudents, newStudent];
      }
    });
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabledRef.current && notificationSoundRef.current) {
      notificationSoundRef.current.play().catch(console.error);
    }
  }, []);

  // Setup WebSocket message handlers
  const setupMessageHandlers = useCallback(() => {
    websocketService.onMessage('violation_event', (data: any) => {
      console.log('Received violation event:', data);

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
      console.log('Received activity event:', data);

      setExamActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 100));
      
      // Add to display activity events (filter out heartbeat to reduce noise)
      if (data.activityType !== 'heartbeat') {
        setDisplayActivityEvents(prevEvents => [data, ...prevEvents].slice(0, 20));
      }
      
      updateStudentSession(data);
    });

    websocketService.onMessage('presence_update', (data: any) => {
      console.log('Received presence update:', data);
      
      if (data.student_count !== undefined) {
        setTotalActiveStudents(data.student_count);
      }
      
      if (data.users && Array.isArray(data.users)) {
        const updatedStudents = data.users.map((user: any) => ({
          studentId: user.id || user.studentId,
          full_name: user.full_name || 'Unknown Student',
          connectionTime: new Date(user.connectionTime || Date.now()),
          lastActivity: new Date(user.lastActivity || Date.now()),
          violationCount: user.violationCount || 0,
          status: user.status || 'active',
          answersSubmitted: user.answersSubmitted || 0,
          answeredQuestionsSet: new Set(user.answeredQuestionsArray || []),
          screenStatus: user.screenStatus || 'normal',
          violationsBySeverity: user.violationsBySeverity || {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          }
        }));
        
        setConnectedStudents(updatedStudents);
      }
    });

    websocketService.onMessage('student_connected', (data: any) => {
      console.log('Student connected:', data);
      
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
              answersSubmitted: 0,
              answeredQuestionsSet: new Set<string>(),
              screenStatus: 'normal',
              violationsBySeverity: {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
              }
            }];
          }
          return prevStudents;
        });
      }
    });

    // Handle streamlined student events
    const handleStudentHeartbeat = (data: any) => {
      if (data.type === 'student_heartbeat') {
        // Just update last activity - no complex processing needed
        setConnectedStudents(prevStudents =>
          prevStudents.map(student => 
            student.studentId === data.student_id
              ? { ...student, lastActivity: new Date(data.timestamp) }
              : student
          )
        );
      }
    };

    const handleStudentExamStart = (data: any) => {
      if (data.type === 'student_exam_start') {
        setConnectedStudents(prevStudents => 
          prevStudents.map(student => 
            student.studentId === data.student_id
              ? { 
                  ...student, 
                  full_name: data.full_name,
                  lastActivity: new Date(data.timestamp)
                }
              : student
          )
        );
      }
    };

    const handleStudentAnswerUpdate = (data: any) => {
      if (data.type === 'student_answer_update') {
        setConnectedStudents(prevStudents => 
          prevStudents.map(student => 
            student.studentId === data.student_id
              ? { 
                  ...student, 
                  lastActivity: new Date(data.timestamp)
                }
              : student
          )
        );
      }
    };

    const handleStudentViolation = (data: any) => {
      if (data.type === 'student_violation') {
        setConnectedStudents(prevStudents => 
          prevStudents.map(student => 
            student.studentId === data.student_id
              ? { 
                  ...student, 
                  violationCount: student.violationCount + 1,
                  lastActivity: new Date(data.timestamp)
                }
              : student
          )
        );
      }
    };

    websocketService.onMessage('student_disconnected', (data: any) => {
      console.log('Student disconnected:', data);
      
      const studentId = data.studentId || data.student_id;
      
      if (studentId) {
        setConnectedStudents(prevStudents => 
          prevStudents.filter(student => student.studentId !== studentId)
        );
        setTotalActiveStudents(prev => Math.max(0, prev - 1));
      }
    });

  }, [playNotificationSound, updateStudentSession]);

  // WebSocket setup
  useEffect(() => {
    if (!examId || !token) return;

    const checkConnectionStatus = () => {
      const isConnected = websocketService.isConnected();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        setLastHeartbeat(new Date());
      }
    };

    const handleStudentActivity = (data: any) => {
      if (data.type === 'student_activity') {
        updateStudentSession(data);
      }
    };

    // Initialize WebSocket connection
    websocketService.connect(token, examId);
    setupMessageHandlers();
    
    // Check connection status periodically
    pingIntervalRef.current = setInterval(checkConnectionStatus, 20000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [examId, token, setupMessageHandlers, updateStudentSession]);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  }, []);

  // Sorting functionality
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedStudents = () => {
    return [...connectedStudents].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'full_name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'violationCount':
          aValue = a.violationCount;
          bValue = b.violationCount;
          break;
        case 'lastActivity':
          aValue = a.lastActivity.getTime();
          bValue = b.lastActivity.getTime();
          break;
        case 'progress':
          aValue = totalExamQuestions > 0 ? (a.answersSubmitted / totalExamQuestions) : 0;
          bValue = totalExamQuestions > 0 ? (b.answersSubmitted / totalExamQuestions) : 0;
          break;
        case 'answersSubmitted':
          aValue = a.answersSubmitted || 0;
          bValue = b.answersSubmitted || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

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
  const formatTimestamp = (timestamp: string | number | Date) => {
    let dateValue: Date;
    
    if (timestamp instanceof Date) {
      dateValue = timestamp;
    } else if (typeof timestamp === 'number') {
      dateValue = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      dateValue = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }
    
    if (isNaN(dateValue.getTime())) {
      return 'Invalid Date';
    }
    
    return dateValue.toLocaleTimeString('id-ID');
  };

  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 10) return 'Baru saja';
    if (diffSeconds < 60) return `${diffSeconds} detik lalu`;
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    return formatTimestamp(timestamp);
  };

  // Get status color and icon
  const getStatusDisplay = (student: ConnectedStudent) => {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - student.lastActivity.getTime();
    const isInactive = timeSinceLastActivity > 60000; // 1 minute
    
    if (student.status === 'terminated') {
      return {
        color: 'text-red-600 bg-red-100',
        icon: XCircle,
        text: 'Dihentikan'
      };
    }
    
    if (student.status === 'suspicious' || student.violationCount >= 5) {
      return {
        color: 'text-red-600 bg-red-100',
        icon: AlertTriangle,
        text: 'Mencurigakan'
      };
    }
    
    if (isInactive) {
      return {
        color: 'text-yellow-600 bg-yellow-100',
        icon: Clock,
        text: 'Tidak Aktif'
      };
    }
    
    return {
      color: 'text-green-600 bg-green-100',
      icon: CheckCircle,
      text: 'Aktif'
    };
  };

  const getViolationBadgeColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 2) return 'bg-yellow-100 text-yellow-800';
    if (count <= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScreenStatusDisplay = (student: ConnectedStudent) => {
    switch (student.screenStatus) {
      case 'very_small':
        return {
          color: 'text-red-600',
          text: `Sangat Kecil (${student.screenReductionPercentage || 0}%)`
        };
      case 'reduced':
        return {
          color: 'text-yellow-600',
          text: `Berkurang (${student.screenReductionPercentage || 0}%)`
        };
      default:
        return {
          color: 'text-green-600',
          text: 'Normal'
        };
    }
  };

  const getProgressDisplay = (student: ConnectedStudent) => {
    if (totalExamQuestions === 0) {
      return {
        text: 'N/A',
        percentage: 0,
        color: 'text-gray-600'
      };
    }
    
    const percentage = Math.round((student.answersSubmitted / totalExamQuestions) * 100);
    
    let color = 'text-gray-600';
    if (percentage >= 80) color = 'text-green-600';
    else if (percentage >= 50) color = 'text-blue-600';
    else if (percentage >= 25) color = 'text-yellow-600';
    else color = 'text-red-600';
    
    return {
      text: `${student.answersSubmitted}/${totalExamQuestions} (${percentage}%)`,
      percentage,
      color
    };
  };

  const getViolationDescription = (violation: ViolationEvent) => {
    const { violation_type, details = {} } = violation;
    
    if (!violation_type || typeof violation_type !== 'string') {
      if (details.visibilityState === 'hidden') {
        return 'Menyembunyikan halaman ujian';
      }
      if (details.tabActive === false) {
        return 'Pindah tab dari halaman ujian';
      }
      return 'Aktivitas mencurigakan terdeteksi';
    }
    
    switch (violation_type) {
      case 'tab_switch_return':
        const inactiveTime = details?.inactiveTime ? Math.round(details.inactiveTime / 1000) : 0;
        return `Kembali ke tab ujian setelah ${inactiveTime} detik`;
      case 'suspicious_key':
        return `Menekan tombol mencurigakan: ${details?.key || 'Unknown'}`;
      case 'devtools_detected':
        return `Developer Tools terdeteksi`;
      case 'screen_height_reduction':
        return `Pengurangan tinggi layar ${details?.reductionPercentage || 0}%`;
      case 'right_click_attempt':
        return 'Mencoba klik kanan pada halaman ujian';
      case 'copy_attempt':
        return 'Mencoba menyalin teks';
      case 'paste_attempt':
        return 'Mencoba menempel teks';
      case 'fullscreen_exit':
        return 'Keluar dari mode fullscreen';
      case 'page_hidden':
        return 'Menyembunyikan halaman ujian';
      case 'rapid_clicking':
        return `Klik cepat tidak wajar (${details?.clickCount || 0} klik)`;
      case 'rapid_typing':
        return `Ketikan cepat tidak wajar (${details?.keystrokeCount || 0} ketukan)`;
      default:
        try {
          return violation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } catch (error) {
          return `Pelanggaran: ${violation_type}`;
        }
    }
  };

  const getActivityDescription = (activity: ExamActivityEvent) => {
    const { activityType, details = {} } = activity;
    const studentName = details?.full_name || activity.student_name || 'Siswa';
    
    if (!activityType || typeof activityType !== 'string') {
      return `${studentName} melakukan aktivitas pada ujian`;
    }
    
    switch (activityType) {
      case 'answer_update':
        const questionPos = details?.questionPosition || 'Unknown';
        return `Menjawab soal ${questionPos}`;
      case 'question_viewed':
        return `Melihat soal ${details?.questionPosition || 'Unknown'}`;
      case 'fullscreen_exit':
        return `Keluar dari mode fullscreen`;
      case 'screen_resize':
        return `Mengubah ukuran layar`;
      case 'question_time_spent':
        const timeSpent = details?.timeSpent ? Math.round(details.timeSpent / 1000) : 0;
        return `Menghabiskan ${timeSpent} detik pada soal ${details?.questionPosition || 'Unknown'}`;
      case 'heartbeat':
        return `Aktif dalam ujian`;
      default:
        try {
          return activityType.replace(/_/g, ' ');
        } catch (error) {
          return `Aktivitas: ${activityType}`;
        }
    }
  };

  const sortedStudents = getSortedStudents();

  // Calculate overall exam statistics
  const examStats = {
    totalStudents: connectedStudents.length,
    averageProgress: connectedStudents.length > 0 && totalExamQuestions > 0 
      ? Math.round((connectedStudents.reduce((sum, student) => sum + student.answersSubmitted, 0) / connectedStudents.length / totalExamQuestions) * 100)
      : 0,
    studentsCompleted: connectedStudents.filter(s => s.answersSubmitted >= totalExamQuestions).length,
    studentsWithViolations: connectedStudents.filter(s => s.violationCount > 0).length
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
                  <h1 className="text-2xl font-bold text-gray-900">Monitoring Ujian Real-time</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ID Ujian: {examId}</span>
                    {totalExamQuestions > 0 && (
                      <span>Total Soal: {totalExamQuestions}</span>
                    )}
                  </div>
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Terhubung</p>
                <p className="text-2xl font-bold text-gray-900">{examStats.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Aktif dalam ujian</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">{examStats.averageProgress}%</p>
                <p className="text-xs text-gray-500 mt-1">Penyelesaian ujian</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{examStats.studentsCompleted}</p>
                <p className="text-xs text-gray-500 mt-1">Menjawab semua soal</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pelanggaran</p>
                <p className="text-2xl font-bold text-gray-900">{violationEvents.length}</p>
                <p className="text-xs text-gray-500 mt-1">Semua tingkat</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Siswa Bermasalah</p>
                <p className="text-2xl font-bold text-gray-900">{examStats.studentsWithViolations}</p>
                <p className="text-xs text-gray-500 mt-1">Ada pelanggaran</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Student Monitoring Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Monitoring Siswa Real-time</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {connectedStudents.length} siswa terhubung
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
            </div>
          </div>
          
          {connectedStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Siswa Terhubung</h4>
              <p className="text-gray-500">Siswa akan muncul di sini ketika mereka mulai mengerjakan ujian</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nama Siswa</span>
                        {renderSortIcon('full_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('violationCount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Pelanggaran</span>
                        {renderSortIcon('violationCount')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('lastActivity')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Aktivitas Terakhir</span>
                        {renderSortIcon('lastActivity')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Layar
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('progress')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Progress Ujian</span>
                        {renderSortIcon('progress')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudents.map((student) => {
                    const statusDisplay = getStatusDisplay(student);
                    const screenDisplay = getScreenStatusDisplay(student);
                    const progressDisplay = getProgressDisplay(student);
                    const StatusIcon = statusDisplay.icon;
                    
                    return (
                      <tr 
                        key={student.studentId} 
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDetailPanel(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                              <div className="text-sm text-gray-500">ID: {student.studentId.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusDisplay.text}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getViolationBadgeColor(student.violationCount)}`}>
                              {student.violationCount}
                            </span>
                            {student.violationCount > 0 && (
                              <div className="text-xs text-gray-500">
                                <div>K: {student.violationsBySeverity.critical}</div>
                                <div>T: {student.violationsBySeverity.high}</div>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {student.latestActivityDescription || 'Belum ada aktivitas'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.latestActivityTimestamp ? formatRelativeTime(student.latestActivityTimestamp) : '-'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${screenDisplay.color}`}>
                            {screenDisplay.text}
                          </div>
                          {student.originalScreenHeight && student.currentScreenHeight && (
                            <div className="text-xs text-gray-500">
                              {student.originalScreenHeight}px → {student.currentScreenHeight}px
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`text-sm font-medium ${progressDisplay.color}`}>
                              {progressDisplay.text}
                            </div>
                            {totalExamQuestions > 0 && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    progressDisplay.percentage >= 80 ? 'bg-green-500' :
                                    progressDisplay.percentage >= 50 ? 'bg-blue-500' :
                                    progressDisplay.percentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${progressDisplay.percentage}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                                setShowDetailPanel(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Detail
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                terminateExam(student.studentId);
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Hentikan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Detail Panel */}
        {showDetailPanel && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {selectedStudent.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.full_name}</h2>
                    <p className="text-sm text-gray-500">Detail Monitoring Siswa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Student Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Informasi Siswa</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${getStatusDisplay(selectedStudent).color.split(' ')[0]}`}>
                          {getStatusDisplay(selectedStudent).text}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Progress Ujian:</span>
                        <span className={`text-sm font-medium ${getProgressDisplay(selectedStudent).color}`}>
                          {getProgressDisplay(selectedStudent).text}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Pelanggaran:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedStudent.violationCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Terhubung Sejak:</span>
                        <span className="text-sm font-medium text-gray-900">{formatTimestamp(selectedStudent.connectionTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status Layar:</span>
                        <span className={`text-sm font-medium ${getScreenStatusDisplay(selectedStudent).color}`}>
                          {getScreenStatusDisplay(selectedStudent).text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Violation Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Ringkasan Pelanggaran</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kritis:</span>
                        <span className="text-sm font-medium text-red-600">{selectedStudent.violationsBySeverity.critical}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tinggi:</span>
                        <span className="text-sm font-medium text-orange-600">{selectedStudent.violationsBySeverity.high}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sedang:</span>
                        <span className="text-sm font-medium text-yellow-600">{selectedStudent.violationsBySeverity.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rendah:</span>
                        <span className="text-sm font-medium text-blue-600">{selectedStudent.violationsBySeverity.low}</span>
                      </div>
                      {selectedStudent.latestViolationDescription && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Pelanggaran Terakhir:</span>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedStudent.latestViolationDescription}</p>
                          <p className="text-xs text-gray-500">{selectedStudent.latestViolationTimestamp ? formatRelativeTime(selectedStudent.latestViolationTimestamp) : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activities for Selected Student */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Aktivitas Terbaru</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {displayActivityEvents
                        .filter(event => event.studentId === selectedStudent.studentId)
                        .slice(0, 10)
                        .map((event, index) => (
                          <div key={index} className="flex items-start space-x-3 py-2 border-b border-gray-200 last:border-b-0">
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{getActivityDescription(event)}</p>
                              <p className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      {displayActivityEvents.filter(event => event.studentId === selectedStudent.studentId).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Belum ada aktivitas tercatat</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => terminateExam(selectedStudent.studentId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Hentikan Ujian Siswa
                  </button>
                  <button
                    onClick={() => setShowDetailPanel(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Global Activities - Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Violations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Pelanggaran Terbaru</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {violationEvents.slice(0, 10).map((violation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {violation.details?.full_name || 'Unknown Student'}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {violation.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{getViolationDescription(violation)}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(violation.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {violationEvents.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">Belum ada pelanggaran tercatat</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {displayActivityEvents.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.details?.full_name || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-gray-600">{getActivityDescription(activity)}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {displayActivityEvents.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">Belum ada aktivitas tercatat</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
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


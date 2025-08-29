import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { websocketService } from '@/services/websocket';
import { examSecurityService } from '@/services/examSecurity'; // Import examSecurityService
import { UserProfile } from '@/types/auth';
import { 
  ProctorMonitoringMessage,
  ConnectedUser,
  StudentActivity,
  RoomStats,
  RoomUserEvent,
  StudentExamStartMessage,
  StudentHeartbeatMessage,
  StudentAnswerUpdateMessage,
  StudentViolationMessage,
  StudentActivityMessage
} from '@/types/websocket';

// Debouncing mechanism to prevent duplicate violation logging
const lastLoggedViolation: Record<string, number> = {};
const VIOLATION_DEBOUNCE_TIME = 1000; // 1 second debounce


interface ExamMonitoringProps {
  examId: string;
  studentId: string;
  sessionId: string;
  token: string | null;
  user: UserProfile | null;
  onCriticalViolation: (reason: string) => void;
  onViolationUpdate: (count: number) => void;
}

interface ViolationCount {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

const ExamMonitoring: React.FC<ExamMonitoringProps> = ({
  examId,
  studentId,
  sessionId,
  token,
  user,
  onCriticalViolation,
  onViolationUpdate
}) => {
  const [isTabActive, setIsTabActive] = useState(true);
  const [violationCounts, setViolationCounts] = useState<ViolationCount>({
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  });
  const [soundInitialized, setSoundInitialized] = useState(false);

  // WebSocket monitoring state
  const [connectedUsers, setConnectedUsers] = useState<Record<string, ConnectedUser>>({});
  const [studentActivities, setStudentActivities] = useState<Record<string, StudentActivity>>({});
  const [roomStats, setRoomStats] = useState<RoomStats>({
    proctor_count: 0,
    student_count: 0,
    total_count: 0,
    last_updated: Date.now()
  });
  const [violationsLog, setViolationsLog] = useState<StudentViolationMessage[]>([]);

  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const mouseTracker = useRef({ x: 0, y: 0, clicks: 0 });
  const keyboardTracker = useRef({ keystrokes: 0, suspiciousKeys: 0 });
  const screenHeightTracker = useRef({ 
    // Initial height captured when component mounts
    originalHeight: window.innerHeight,
    currentHeight: window.innerHeight,
    violations: 0
  });
  const criticalViolationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sound after user interaction
  const initializeSound = () => {
    if (!soundInitialized) {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Test if audio context can be created and started
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('ExamMonitoring: Audio context resumed successfully');
            setSoundInitialized(true);
          }).catch((error) => {
            console.warn('ExamMonitoring: Failed to resume audio context:', error);
          });
        } else {
          console.log('ExamMonitoring: Audio context ready');
          setSoundInitialized(true);
        }
      } catch (error) {
        console.warn('ExamMonitoring: Failed to initialize audio context:', error);
      }
    }
  };

  // Add click listener to initialize sound on first user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      initializeSound();
      document.removeEventListener('click', handleFirstClick);
    };
    
    document.addEventListener('click', handleFirstClick);
    
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, []);
  useEffect(() => {
    setupMonitoring();

    return () => {
      cleanup();
    };
  }, []);

  // Add WebSocket message logging for debugging
  useEffect(() => {
    if (!securityPassed) return;

    // Handler for room user events (connect/disconnect)
    const handleRoomUserEvent = (data: RoomUserEvent) => {
      console.log('📊 Room User Event:', data.action, data.user.username);
      
      setConnectedUsers(prev => {
        const updated = { ...prev };
        
        if (data.action === 'connected') {
          updated[data.user.user_id] = {
            user_id: data.user.user_id,
            username: data.user.username,
            full_name: data.user.username, // Use username as fallback
            roles: data.user.roles,
            user_type: data.user.user_type,
            connected_at: data.user.timestamp * 1000, // Convert to milliseconds
            last_activity: Date.now()
          };
        } else if (data.action === 'disconnected') {
          delete updated[data.user.user_id];
        }
        
        return updated;
      });
      
      setRoomStats({
        proctor_count: data.room_stats.proctor_count,
        student_count: data.room_stats.student_count,
        total_count: data.room_stats.total_count,
        last_updated: Date.now()
      });
    };

    // Handler for student exam start
    const handleStudentExamStart = (data: StudentExamStartMessage) => {
      console.log('🎯 Student Exam Start:', data.full_name);
      
      setStudentActivities(prev => ({
        ...prev,
        [data.student_id]: {
          student_id: data.student_id,
          full_name: data.full_name,
          last_heartbeat: data.timestamp as number,
          last_answer_update: 0,
          total_answered: 0,
          current_question: 1,
          device_info: data.raw_message.device_info,
          violations: { low: 0, medium: 0, high: 0, critical: 0 },
          recent_violations: []
        }
      }));
    };

    // Handler for student heartbeat
    const handleStudentHeartbeat = (data: StudentHeartbeatMessage) => {
      console.log('💓 Student Heartbeat:', data.full_name);
      
      setStudentActivities(prev => {
        const current = prev[data.student_id];
        if (!current) return prev;
        
        return {
          ...prev,
          [data.student_id]: {
            ...current,
            last_heartbeat: data.timestamp as number
          }
        };
      });
    };

    // Handler for student answer updates
    const handleStudentAnswerUpdate = (data: StudentAnswerUpdateMessage) => {
      console.log('✏️ Student Answer Update:', data.full_name, 'Question', data.raw_message.question_number);
      
      setStudentActivities(prev => {
        const current = prev[data.student_id];
        if (!current) return prev;
        
        return {
          ...prev,
          [data.student_id]: {
            ...current,
            last_answer_update: data.timestamp as number,
            total_answered: data.raw_message.total_answered,
            current_question: data.raw_message.question_number
          }
        };
      });
    };

    // Handler for student violations
    const handleStudentViolation = (data: StudentViolationMessage) => {
      console.log('⚠️ Student Violation:', data.full_name, data.violation_type, data.severity);
      
      setStudentActivities(prev => {
        const current = prev[data.student_id];
        if (!current) return prev;
        
        const updatedViolations = { ...current.violations };
        updatedViolations[data.severity] += 1;
        
        const recentViolations = [...current.recent_violations, data];
        // Keep only last 10 violations
        if (recentViolations.length > 10) {
          recentViolations.shift();
        }
        
        return {
          ...prev,
          [data.student_id]: {
            ...current,
            violations: updatedViolations,
            recent_violations: recentViolations
          }
        };
      });
      
      // Add to violations log
      setViolationsLog(prev => {
        const updated = [...prev, data];
        // Keep only last 50 violations
        if (updated.length > 50) {
          updated.shift();
        }
        return updated;
      });
    };

    // Handler for student activities
    const handleStudentActivity = (data: StudentActivityMessage) => {
      console.log('📝 Student Activity:', data.full_name, data.activityType);
      
      setStudentActivities(prev => {
        const current = prev[data.student_id];
        if (!current) return prev;
        
        return {
          ...prev,
          [data.student_id]: {
            ...current,
            last_activity: data.timestamp as number
          }
        };
      });
    };

    // Register all message handlers
    websocketService.onMessage('room_user_event', handleRoomUserEvent);
    websocketService.onMessage('student_exam_start', handleStudentExamStart);
    websocketService.onMessage('student_heartbeat', handleStudentHeartbeat);
    websocketService.onMessage('student_answer_update', handleStudentAnswerUpdate);
    websocketService.onMessage('student_violation', handleStudentViolation);
    websocketService.onMessage('student_activity', handleStudentActivity);

    // Cleanup function
    return () => {
      websocketService.offMessage('room_user_event');
      websocketService.offMessage('student_exam_start');
      websocketService.offMessage('student_heartbeat');
      websocketService.offMessage('student_answer_update');
      websocketService.offMessage('student_violation');
      websocketService.offMessage('student_activity');
      
      // Clear any pending critical violation timeout
      if (criticalViolationTimeoutRef.current) {
        clearTimeout(criticalViolationTimeoutRef.current);
      }
    };
  }, [examId, studentId, sessionId, securityPassed]);

  const setupMonitoring = () => {
    // 1. Tab/Window Focus Monitoring
    setupFocusMonitoring();
    
    // 2. Visibility Change Detection
    setupVisibilityMonitoring();
    
    // 3. Mouse Behavior Tracking
    setupMouseTracking();
    
    // 4. Keyboard Event Monitoring
    setupKeyboardTracking();
    
    // 5. Clipboard Monitoring
    setupClipboardMonitoring();
    
    // 6. DevTools Continuous Check
    setupDevToolsMonitoring();
    
    // 7. Fullscreen Monitoring
    setupFullscreenMonitoring();
    
    // 8. Screen Height Monitoring (Split Screen Detection)
    setupScreenHeightMonitoring();
  };

  // 1. Tab/Window Focus Monitoring
  const setupFocusMonitoring = () => {
    const handleFocus = () => {
      setIsTabActive(true);
      const inactiveTime = Date.now() - lastActiveTime.current;
      
      if (inactiveTime > 5000) { // 5 seconds
        logViolation('tab_switch_return', 'medium', {
          inactiveTime: inactiveTime,
          switchCount: tabSwitchCount.current
        });
      }
    };

    const handleBlur = () => {
      setIsTabActive(false);
      lastActiveTime.current = Date.now();
      tabSwitchCount.current += 1;
      
      // Tab switch will be handled by visibility change event to avoid duplication

      // Show warning after 3 tab switches
      if (tabSwitchCount.current >= 3) {
      }

      // Critical violation after 5 tab switches
      if (tabSwitchCount.current >= 5) {
        reportCriticalViolation('Terlalu banyak perpindahan tab. Ujian dihentikan untuk menjaga integritas.');
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  };

  // 2. Visibility Change Detection
  const setupVisibilityMonitoring = () => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('page_hidden', 'high', {
          timestamp: Date.now(),
          visibilityState: document.visibilityState
        });
      } else {
        logViolation('page_visible', 'medium', {
          timestamp: Date.now(),
          visibilityState: document.visibilityState
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // 3. Mouse Behavior Tracking
  const setupMouseTracking = () => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTracker.current.x = e.clientX;
      mouseTracker.current.y = e.clientY;
    };

    const handleMouseClick = (e: MouseEvent) => {
      mouseTracker.current.clicks += 1;
      
      // Detect right clicks
      if (e.button === 2) {
        logViolation('right_click_attempt', 'medium', {
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        });
      }

      // Detect rapid clicking (potential automation)
      const rapidClickThreshold = 10;
      if (mouseTracker.current.clicks > rapidClickThreshold) {
        const timeWindow = 5000; // 5 seconds
        setTimeout(() => {
          mouseTracker.current.clicks = Math.max(0, mouseTracker.current.clicks - rapidClickThreshold);
        }, timeWindow);

        logViolation('rapid_clicking', 'high', {
          clickCount: mouseTracker.current.clicks,
          timestamp: Date.now()
        });
      }
    };

    const handleMouseLeave = () => {
      logViolation('mouse_leave_window', 'low', {
        timestamp: Date.now()
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    document.addEventListener('contextmenu', handleMouseClick);
    document.addEventListener('mouseleave', handleMouseLeave);
  };

  // 4. Keyboard Event Monitoring
  const setupKeyboardTracking = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardTracker.current.keystrokes += 1;

      // Monitor suspicious key combinations
      const suspiciousKeys = [
        'F12', 'F5', 'F11',
        'PrintScreen', 'Insert', 'Delete'
      ];

      const suspiciousCombinations = [
        { ctrl: true, shift: true, key: 'I' },
        { ctrl: true, shift: true, key: 'J' },
        { ctrl: true, shift: true, key: 'C' },
        { ctrl: true, key: 'U' },
        { ctrl: true, key: 'S' },
        { ctrl: true, key: 'A' },
        { ctrl: true, key: 'C' },
        { ctrl: true, key: 'V' },
        { alt: true, key: 'Tab' },
        { alt: true, key: 'F4' }
      ];

      if (suspiciousKeys.includes(e.key)) {
        keyboardTracker.current.suspiciousKeys += 1;
        logViolation('suspicious_key', 'high', {
          key: e.key,
          timestamp: Date.now()
        });
      }

      for (const combo of suspiciousCombinations) {
        if (
          (combo.ctrl === undefined || combo.ctrl === e.ctrlKey) &&
          (combo.shift === undefined || combo.shift === e.shiftKey) &&
          (combo.alt === undefined || combo.alt === e.altKey) &&
          combo.key.toLowerCase() === e.key.toLowerCase()
        ) {
          keyboardTracker.current.suspiciousKeys += 1;
          logViolation('suspicious_combination', 'high', {
            combination: `${combo.ctrl ? 'Ctrl+' : ''}${combo.shift ? 'Shift+' : ''}${combo.alt ? 'Alt+' : ''}${combo.key}`,
            timestamp: Date.now()
          });
        }
      }

      // Detect very fast typing (potential automation)
      const typingSpeed = keyboardTracker.current.keystrokes;
      if (typingSpeed > 200) { // 200 keystrokes in monitoring window
        logViolation('rapid_typing', 'medium', {
          keystrokeCount: typingSpeed,
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
  };

  // 5. Clipboard Monitoring
  const setupClipboardMonitoring = () => {
    const handleCopy = () => {
      logViolation('copy_attempt', 'high', {
        timestamp: Date.now()
      });
    };

    const handlePaste = () => {
      logViolation('paste_attempt', 'high', {
        timestamp: Date.now()
      });
    };

    const handleCut = () => {
      logViolation('cut_attempt', 'high', {
        timestamp: Date.now()
      });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
  };

  // 6. DevTools Continuous Monitoring
  const setupDevToolsMonitoring = () => {
    const checkDevTools = () => {
      let devtoolsScore = 0;
      const threshold = 80; // Higher threshold for continuous monitoring

      // Size-based detection (more lenient)
      try {
        const heightDiff = window.outerHeight - window.innerHeight;
        const widthDiff = window.outerWidth - window.innerWidth;
        
        // Even more lenient for continuous monitoring
        if (heightDiff > 300 && widthDiff > 350) {
          devtoolsScore += 40;
        } else if (heightDiff > 250 || widthDiff > 300) {
          devtoolsScore += 20;
        }
      } catch (error) {
        console.warn('Continuous window size detection failed:', error);
      }

      // Performance-based detection (less frequent)
      try {
        const start = performance.now();

        const end = performance.now();
        
        // Higher threshold for continuous monitoring
        if (end - start > 300) {
          devtoolsScore += 30;
        }
      } catch (error) {
      }

      // Check for rapid console clearing (potential DevTools usage)
      try {
        const now = Date.now();
        if (window.lastConsoleCheck && (now - window.lastConsoleCheck) < 1000) {
          devtoolsScore += 10;
        }
        window.lastConsoleCheck = now;
      } catch (error) {
      }

      if (devtoolsScore >= threshold) {
        logViolation('devtools_detected', 'critical', {
          timestamp: Date.now(),
          score: devtoolsScore,
          windowSize: {
            outer: { width: window.outerWidth, height: window.outerHeight },
            inner: { width: window.innerWidth, height: window.innerHeight }
          }
        });
        
      } else if (devtoolsScore >= 40) {
        logViolation('devtools_suspected', 'medium', {
          timestamp: Date.now(),
          score: devtoolsScore
        });
      }
    };

    // Less frequent checking to reduce false positives
    monitoringInterval.current = setInterval(checkDevTools, 3000); // Check every 3 seconds
  };

  // 7. Fullscreen Monitoring
  const setupFullscreenMonitoring = () => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Log the violation first
        logViolation('fullscreen_exit', 'high', {
          timestamp: Date.now()
        });
        
        // Handle fullscreen exit with proper user gesture requirement
        handleFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
  };

  // 8. Screen Height Monitoring (Split Screen Detection)
  const setupScreenHeightMonitoring = () => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const originalHeight = screenHeightTracker.current.originalHeight;
      const heightReduction = originalHeight - currentHeight;
      const reductionPercentage = (heightReduction / originalHeight) * 100;
      
      screenHeightTracker.current.currentHeight = currentHeight;
      
      // Detect significant height reduction (possible split screen)
      if (reductionPercentage > 30) { // More than 30% height reduction
        screenHeightTracker.current.violations += 1;
        
        logViolation('screen_height_reduction', 'high', {
          originalHeight,
          currentHeight,
          reductionPercentage: Math.round(reductionPercentage),
          violationCount: screenHeightTracker.current.violations,
          timestamp: Date.now()
        });
        
        // Critical violation after multiple height reductions
        if (screenHeightTracker.current.violations >= 3) {
          reportCriticalViolation(`Split screen atau pengurangan tinggi layar terdeteksi (${Math.round(reductionPercentage)}% pengurangan). Ujian dihentikan.`);
        }
      }
      
      // Also check for very small screen height (possible mobile split screen)
      if (currentHeight < 400) {
        logViolation('very_small_screen_height', 'medium', {
          currentHeight,
          timestamp: Date.now()
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
  };

  // Function to report critical violations to the backend
  const reportCriticalViolation = async (reason: string) => {
    if (!token || !user?._id) return;

    const violation: any = {
      type: 'critical_violation_event',
      violation_type: 'exam_terminated_by_system',
      severity: 'critical',
      timestamp: Date.now(),
      examId,
      studentId: user._id,
      sessionId,
      details: {
        reason,
        userAgent: navigator.userAgent,
        url: window.location.href,
        full_name: user?.profile_details?.full_name || 'Unknown Student'
      },
    };

    // Send critical violation to backend
    await examSecurityService.reportCriticalViolation(token, examId, user._id, violation);
  };

  // Violation Logging - Modified to send via WebSocket
  const logViolation = (type: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
    // Implement debouncing to prevent duplicate violations
    const now = Date.now();
    const violationKey = `${type}_${severity}`;
    
    if (lastLoggedViolation[violationKey] && (now - lastLoggedViolation[violationKey]) < VIOLATION_DEBOUNCE_TIME) {
      // Skip logging if same violation type was logged recently
      return;
    }
    
    lastLoggedViolation[violationKey] = now;

    // Send streamlined violation data
    const violation = {
      type: 'student_violation',
      student_id: studentId,
      exam_id: examId,
      session_id: sessionId,
      violation_type: type,
      severity,
      timestamp: now,
      // Only send essential details
      tab_active: isTabActive,
      screen_height: screenHeightTracker.current.currentHeight,
      ...(details?.reductionPercentage && { screen_reduction: details.reductionPercentage })
    };

    // Send violation via WebSocket
    websocketService.send(violation);

    // Store in localStorage for backup
    const violationsKey = `exam_violations_${examId}_${studentId}`;
    console.log('Sending WebSocket message:', violation);
    
    setViolationCounts(prev => {
      const newCounts = { ...prev };
      newCounts[severity] += 1;
      const totalViolations = newCounts.low + newCounts.medium + newCounts.high + newCounts.critical;
      
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        onViolationUpdate(totalViolations);
      }, 0);
      
      return newCounts;
    });

  };

  const handleFullscreenExit = () => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      console.log('ExamMonitoring: Fullscreen exit detected, but allowing exam to continue');
      // For now, just log the violation but don't force critical violation
      // This prevents exam termination due to accidental fullscreen exit
    }, 100); // Small delay to avoid setState during render
  };

  // Activity Logging - For non-violation events
  const logActivity = (activityType: string, details?: any) => {
    // Send streamlined activity data
    const activity = {
      type: 'student_activity',
      student_id: studentId,
      exam_id: examId,
      session_id: sessionId,
      activity_type: activityType,
      timestamp: Date.now(),
      // Only essential details
      ...(details && Object.keys(details).length > 0 && { details })
    };

    // Send activity via WebSocket
    websocketService.send(activity);
  };

  // Cleanup
  const cleanup = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }
    
    if (criticalViolationTimeoutRef.current) {
      clearTimeout(criticalViolationTimeoutRef.current);
    }
  };

  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs z-40 max-w-sm">
          <div className="space-y-1">
            <div className="font-semibold text-yellow-300">Local Violations:</div>
            <div>L:{violationCounts.low} M:{violationCounts.medium} H:{violationCounts.high} C:{violationCounts.critical}</div>
            <div>Tab Switches: {tabSwitchCount.current}</div>
            <div>Active: {isTabActive ? 'Yes' : 'No'}</div>
            <div>Screen: {screenHeightTracker.current.currentHeight}px</div>
            
            <div className="font-semibold text-green-300 mt-2">WebSocket Data:</div>
            <div>Connected Users: {Object.keys(connectedUsers).length}</div>
            <div>Students: {roomStats.student_count}</div>
            <div>Proctors: {roomStats.proctor_count}</div>
            <div>Active Students: {Object.keys(studentActivities).length}</div>
            <div>Violations Log: {violationsLog.length}</div>
            
            {Object.values(studentActivities).map(student => (
              <div key={student.student_id} className="border-t border-gray-600 pt-1 mt-1">
                <div className="text-blue-300">{student.full_name}:</div>
                <div>Q{student.current_question} ({student.total_answered} answered)</div>
                <div>V: L:{student.violations.low} M:{student.violations.medium} H:{student.violations.high} C:{student.violations.critical}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ExamMonitoring;
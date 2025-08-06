import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface ExamMonitoringProps {
  examId: string;
  studentId: string;
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
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const backupInterval = useRef<NodeJS.Timeout | null>(null);
  const mouseTracker = useRef({ x: 0, y: 0, clicks: 0 });
  const keyboardTracker = useRef({ keystrokes: 0, suspiciousKeys: 0 });

  useEffect(() => {
    setupMonitoring();
    startPeriodicBackup();

    return () => {
      cleanup();
    };
  }, []);

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
    
    // 6. Screen Recording Detection
    setupScreenRecordingDetection();
    
    // 7. DevTools Continuous Check
    setupDevToolsMonitoring();
    
    // 8. Fullscreen Monitoring
    setupFullscreenMonitoring();
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
      
      logViolation('tab_switch', 'high', {
        switchCount: tabSwitchCount.current,
        timestamp: Date.now()
      });

      // Show warning after 3 tab switches
      if (tabSwitchCount.current >= 3) {
        showViolationWarning('Terlalu banyak perpindahan tab terdeteksi. Ujian akan otomatis dikumpulkan jika terus berlanjut.');
      }

      // Critical violation after 5 tab switches
      if (tabSwitchCount.current >= 5) {
        onCriticalViolation('Terlalu banyak perpindahan tab. Ujian dihentikan untuk menjaga integritas.');
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
    const handleKeyDown = (e: KeyEvent) => {
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

    document.addEventListener('keydown', handleKeyDown as any);
  };

  // 5. Clipboard Monitoring
  const setupClipboardMonitoring = () => {
    const handleCopy = () => {
      logViolation('copy_attempt', 'high', {
        timestamp: Date.now()
      });
      showViolationWarning('Menyalin konten ujian tidak diperbolehkan.');
    };

    const handlePaste = () => {
      logViolation('paste_attempt', 'high', {
        timestamp: Date.now()
      });
      showViolationWarning('Menempel konten dari luar tidak diperbolehkan.');
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

  // 6. Screen Recording Detection
  const setupScreenRecordingDetection = () => {
    // Check for screen capture API usage
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        logViolation('screen_capture_attempt', 'critical', {
          timestamp: Date.now(),
          method: 'getDisplayMedia'
        });
        onCriticalViolation('Screen recording terdeteksi. Ujian dihentikan.');
        return originalGetDisplayMedia.apply(this, args);
      };
    }

    // Monitor for common screen recording software
    const checkScreenRecording = () => {
      // Check for OBS, Bandicam, etc. (simplified detection)
      const suspiciousProcesses = [
        'obs', 'bandicam', 'camtasia', 'screencast',
        'recordmydesktop', 'simplescreenrecorder'
      ];

      // This is a simplified check - in real implementation,
      // you might need more sophisticated detection
      const userAgent = navigator.userAgent.toLowerCase();
      for (const process of suspiciousProcesses) {
        if (userAgent.includes(process)) {
          logViolation('screen_recording_software', 'critical', {
            detectedSoftware: process,
            timestamp: Date.now()
          });
        }
      }
    };

    setInterval(checkScreenRecording, 10000); // Check every 10 seconds
  };

  // 7. DevTools Continuous Monitoring
  const setupDevToolsMonitoring = () => {
    const checkDevTools = () => {
      let devtools = false;

      // Size-based detection
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        devtools = true;
      }

      // Performance-based detection
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        devtools = true;
      }

      if (devtools) {
        logViolation('devtools_detected', 'critical', {
          timestamp: Date.now(),
          windowSize: {
            outer: { width: window.outerWidth, height: window.outerHeight },
            inner: { width: window.innerWidth, height: window.innerHeight }
          }
        });
        onCriticalViolation('Developer Tools terdeteksi terbuka. Ujian dihentikan.');
      }
    };

    monitoringInterval.current = setInterval(checkDevTools, 1000); // Check every second
  };

  // 8. Fullscreen Monitoring
  const setupFullscreenMonitoring = () => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation('fullscreen_exit', 'high', {
          timestamp: Date.now()
        });
        showViolationWarning('Ujian harus dilakukan dalam mode fullscreen.');
        
        // Try to re-enter fullscreen
        setTimeout(() => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
              onCriticalViolation('Gagal mempertahankan mode fullscreen. Ujian dihentikan.');
            });
          }
        }, 1000);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
  };

  // Violation Logging
  const logViolation = (type: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
    const violation = {
      type,
      severity,
      timestamp: Date.now(),
      examId,
      studentId,
      details: details || {},
      userAgent: navigator.userAgent,
      url: window.location.href,
      tabActive: isTabActive,
      mousePosition: mouseTracker.current,
      keyboardStats: keyboardTracker.current
    };

    // Store in localStorage
    const violationsKey = `exam_violations_${examId}_${studentId}`;
    const existingViolations = JSON.parse(localStorage.getItem(violationsKey) || '[]');
    existingViolations.push(violation);
    localStorage.setItem(violationsKey, JSON.stringify(existingViolations));

    // Update violation counts
    setViolationCounts(prev => {
      const newCounts = { ...prev };
      newCounts[severity] += 1;
      const totalViolations = newCounts.low + newCounts.medium + newCounts.high + newCounts.critical;
      onViolationUpdate(totalViolations);
      return newCounts;
    });

    // Check for critical violation thresholds
    const totalHighViolations = violationCounts.high + violationCounts.critical;
    if (totalHighViolations >= 10) {
      onCriticalViolation('Terlalu banyak pelanggaran keamanan terdeteksi. Ujian dihentikan.');
    }

    console.warn('Violation logged:', violation);
  };

  // Periodic Data Backup
  const startPeriodicBackup = () => {
    backupInterval.current = setInterval(() => {
      const violationsKey = `exam_violations_${examId}_${studentId}`;
      const violations = localStorage.getItem(violationsKey);
      
      if (violations) {
        // Backup to sessionStorage
        const sessionKey = `session_violations_${examId}_${studentId}`;
        sessionStorage.setItem(sessionKey, violations);
        
        // TODO: Send to backend API periodically
        // sendViolationsToBackend(JSON.parse(violations));
      }
    }, 30000); // Every 30 seconds
  };

  // Show Warning
  const showViolationWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  };

  // Cleanup
  const cleanup = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }
    if (backupInterval.current) {
      clearInterval(backupInterval.current);
    }
  };

  return (
    <>
      {/* Tab Inactive Overlay */}
      {!isTabActive && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tab Tidak Aktif
            </h3>
            <p className="text-gray-600 mb-4">
              Kembali ke tab ujian untuk melanjutkan. Perpindahan tab telah dicatat.
            </p>
            <div className="text-sm text-red-600">
              Peringatan: {tabSwitchCount.current}/5 perpindahan tab
            </div>
          </div>
        </div>
      )}

      {/* Violation Warning */}
      {showWarning && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg z-40 max-w-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Peringatan Keamanan</div>
              <div className="text-sm mt-1">{warningMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Violation Counter (for debugging - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs z-40">
          <div>Violations: L:{violationCounts.low} M:{violationCounts.medium} H:{violationCounts.high} C:{violationCounts.critical}</div>
          <div>Tab Switches: {tabSwitchCount.current}</div>
          <div>Active: {isTabActive ? 'Yes' : 'No'}</div>
        </div>
      )}
    </>
  );
};

export default ExamMonitoring;
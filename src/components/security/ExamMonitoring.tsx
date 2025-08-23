import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { websocketService } from '@/services/websocket';

interface ExamMonitoringProps {
  examId: string;
  studentId: string;
  sessionId: string;
  token: string | null;
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

  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const mouseTracker = useRef({ x: 0, y: 0, clicks: 0 });
  const keyboardTracker = useRef({ keystrokes: 0, suspiciousKeys: 0 });
  const screenHeightTracker = useRef({ 
    originalHeight: window.innerHeight,
    currentHeight: window.innerHeight,
    violations: 0
  });

  useEffect(() => {
    setupMonitoring();

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
      
      logViolation('tab_switch', 'high', {
        switchCount: tabSwitchCount.current,
        timestamp: Date.now()
      });

      // Show warning after 3 tab switches
      if (tabSwitchCount.current >= 3) {
        console.warn('Too many tab switches detected:', tabSwitchCount.current);
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
        console.warn('Continuous performance detection failed:', error);
      }

      // Check for rapid console clearing (potential DevTools usage)
      try {
        const now = Date.now();
        if (window.lastConsoleCheck && (now - window.lastConsoleCheck) < 1000) {
          devtoolsScore += 10;
        }
        window.lastConsoleCheck = now;
      } catch (error) {
        console.warn('Console check timing failed:', error);
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
        
        console.warn(`Suspicious activity detected. DevTools score: ${devtoolsScore}`);
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
        websocketService.send({
          type: 'activity_event',
          details: {
            eventType: 'fullscreen_exit',
            timestamp: new Date().toISOString(),
            studentId,
            examId,
            sessionId,
          },
        });
        
        logViolation('fullscreen_exit', 'high', {
          timestamp: Date.now()
        });
        
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
        
        websocketService.send({
          type: 'activity_event',
          details: {
            eventType: 'screen_resize',
            originalHeight,
            currentHeight,
            reductionPercentage: Math.round(reductionPercentage),
            timestamp: new Date().toISOString(),
            studentId,
            examId,
            sessionId,
          },
        });
        
        logViolation('screen_height_reduction', 'high', {
          originalHeight,
          currentHeight,
          reductionPercentage: Math.round(reductionPercentage),
          violationCount: screenHeightTracker.current.violations,
          timestamp: Date.now()
        });
        
        // Critical violation after multiple height reductions
        if (screenHeightTracker.current.violations >= 3) {
          onCriticalViolation(`Split screen atau pengurangan tinggi layar terdeteksi (${Math.round(reductionPercentage)}% pengurangan). Ujian dihentikan.`);
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

  // Violation Logging - Modified to send via WebSocket
  const logViolation = (type: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
    const violation = {
      messageType: 'violation_event',
      type,
      severity,
      timestamp: Date.now(),
      examId,
      studentId,
      sessionId,
      details: details || {},
      userAgent: navigator.userAgent,
      url: window.location.href,
      tabActive: isTabActive,
      mousePosition: mouseTracker.current,
      keyboardStats: keyboardTracker.current
    };

    // Send violation via WebSocket
    websocketService.send(violation);

    // Update local violation counts for display
    setViolationCounts(prev => {
      const newCounts = { ...prev };
      newCounts[severity] += 1;
      const totalViolations = newCounts.low + newCounts.medium + newCounts.high + newCounts.critical;
      onViolationUpdate(totalViolations);
      return newCounts;
    });

    console.warn('Violation logged and sent via WS:', violation);
  };

  // Cleanup
  const cleanup = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
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

      {/* Violation Counter (for debugging - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-xs z-40">
          <div>Violations: L:{violationCounts.low} M:{violationCounts.medium} H:{violationCounts.high} C:{violationCounts.critical}</div>
          <div>Tab Switches: {tabSwitchCount.current}</div>
          <div>Active: {isTabActive ? 'Yes' : 'No'}</div>
          <div>Screen: {screenHeightTracker.current.currentHeight}px (Original: {screenHeightTracker.current.originalHeight}px)</div>
        </div>
      )}
    </>
  );
};

export default ExamMonitoring;


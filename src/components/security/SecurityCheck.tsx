import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, Check, Loader2, Monitor, Eye, Lock, Wifi } from 'lucide-react';

interface SecurityCheckProps {
  onSecurityPassed: () => void;
  onSecurityFailed: (reason: string) => void;
  examId: string;
  studentId: string;
}

interface SecurityCheckResult {
  passed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({
  onSecurityPassed,
  onSecurityFailed,
  examId,
  studentId
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [gestureMessage, setGestureMessage] = useState('');
  const intervalRef = useRef<number | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start security checks after component mounts
    const timer = setTimeout(() => {
      performSecurityChecks();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleFullscreenGesture = async () => {
    try {
      await document.documentElement.requestFullscreen();
      console.log('SecurityCheck: Fullscreen activated successfully');
      setNeedsUserGesture(false);
      setIsChecking(false);
      
      // Self-destruct after fullscreen
      setTimeout(() => {
        if (componentRef.current) {
          componentRef.current.remove();
        }
      }, 500);
      
      onSecurityPassed();
    } catch (error) {
      console.warn('SecurityCheck: Fullscreen activation failed:', error);
      // Continue anyway - fullscreen failure shouldn't block exam
      setNeedsUserGesture(false);
      setIsChecking(false);
      
      setTimeout(() => {
        if (componentRef.current) {
          componentRef.current.remove();
        }
      }, 500);
      
      onSecurityPassed();
    }
  };
  
  const updateProgress = (checkName: string, progressValue: number) => {
    setCurrentCheck(checkName);
    setProgress(Math.min(progressValue, 100)); // Ensure progress never exceeds 100%
  };

  const performSecurityChecks = async () => {
    try {
      // 1. DevTools Detection
      updateProgress('Memeriksa Developer Tools...', 10);
      await sleep(300);
      const devToolsCheck = checkDevTools();
      if (!devToolsCheck.passed) {
        onSecurityFailed(devToolsCheck.reason!);
        return;
      }

      // 2. WebDriver Detection
      updateProgress('Mendeteksi Automated Browser...', 35);
      await sleep(250);
      await sleep(150);
      const webDriverCheck = checkWebDriver();
      if (!webDriverCheck.passed) {
        onSecurityFailed(webDriverCheck.reason!);
        return;
      }

      // 3. Device Fingerprinting
      updateProgress('Membuat Sidik Jari Perangkat...', 65);
      await sleep(400);
      await sleep(200);
      const fingerprintCheck = await generateDeviceFingerprint();
      if (!fingerprintCheck.passed) {
        onSecurityFailed(fingerprintCheck.reason!);
        return;
      }

      // 4. Final Security Setup
      updateProgress('Menyelesaikan Konfigurasi Keamanan...', 90);
      await sleep(200);
      await sleep(100);
      const setupCheck = setupSecurityEnvironment();
      if (!setupCheck.passed) {
        onSecurityFailed(setupCheck.reason!);
        return;
      }

      // All checks passed
      updateProgress('Pemeriksaan keamanan selesai!', 100);
      await sleep(300);
      
      // Check if we need user gesture for fullscreen
      setNeedsUserGesture(true);
      setGestureMessage('Klik tombol di bawah untuk masuk mode fullscreen dan melanjutkan ujian');
      

    } catch (error) {
      console.error('Security check error:', error);
      // More graceful error handling
      console.warn('Security check encountered an error, but allowing exam to proceed');
      updateProgress('Pemeriksaan keamanan selesai dengan peringatan', 100);
      await sleep(200);
      setIsChecking(false);
      
      // Self-destruct even on error
      setTimeout(() => {
        if (componentRef.current) {
          componentRef.current.remove();
        }
      }, 1000);
      
      onSecurityPassed();
    }
  };

  const sleep = (ms: number) => new Promise(resolve => {
    setTimeout(resolve, ms);
  });

  // 1. DevTools Detection
  const checkDevTools = (): SecurityCheckResult => {
    let devtoolsScore = 0;
    const maxScore = 100;
    const threshold = 70; // Require 70% confidence to flag as DevTools

    // Method 1: Window Size Detection (more lenient)
    try {
      const heightDiff = window.outerHeight - window.innerHeight;
      const widthDiff = window.outerWidth - window.innerWidth;
      
      // More lenient thresholds accounting for browser UI
      const heightThreshold = 250; // Increased from 160
      const widthThreshold = 300;  // Account for side panels
      
      if (heightDiff > heightThreshold && widthDiff > widthThreshold) {
        devtoolsScore += 30; // Partial score, not definitive
      } else if (heightDiff > heightThreshold || widthDiff > widthThreshold) {
        devtoolsScore += 15; // Even less confident
      }
    } catch (error) {
      console.warn('Window size detection failed:', error);
    }

    // Method 2: Performance-based detection (with retries)
    try {
      let suspiciousCount = 0;
      const attempts = 3;
      
      for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        const end = performance.now();
        
        // More lenient threshold and require multiple confirmations
        if (end - start > 200) { // Increased from 100ms
          suspiciousCount++;
        }
      }
      
      // Only add score if majority of attempts are suspicious
      if (suspiciousCount >= 2) {
        devtoolsScore += 25;
      } else if (suspiciousCount === 1) {
        devtoolsScore += 10;
      }
    } catch (error) {
      console.warn('Performance detection failed:', error);
    }

    return devtoolsScore >= threshold 
      ? { 
          passed: false, 
          reason: 'Developer Tools terdeteksi. Tutup Developer Tools untuk melanjutkan ujian.', 
          severity: 'critical' 
        }
      : { passed: true, severity: 'low' };
  };

  // 2. WebDriver Detection
  const checkWebDriver = (): SecurityCheckResult => {
    // Check for common WebDriver properties
    if ((navigator as any).webdriver) {
      return {
        passed: false,
        reason: 'Browser otomatis terdeteksi. Gunakan browser manual untuk mengikuti ujian.',
        severity: 'critical'
      };
    }

    // Check for headless browser indicators
    if ((window as any).callPhantom || (window as any)._phantom) {
      return {
        passed: false,
        reason: 'Browser headless terdeteksi. Gunakan browser standar untuk ujian.',
        severity: 'critical'
      };
    }

    // Check for missing properties that are present in normal browsers
    if (!(window as any).chrome && navigator.userAgent.includes('Chrome')) {
      return {
        passed: false,
        reason: 'Browser tidak standar terdeteksi.',
        severity: 'high'
      };
    }

    return { passed: true, severity: 'low' };
  };

  // 3. Device Fingerprinting
  const generateDeviceFingerprint = async (): Promise<SecurityCheckResult> => {
    try {
      const fingerprint = await createDeviceFingerprint();
      
      // Store fingerprint (in real app, this would be validated server-side)
      localStorage.setItem(`device_fingerprint_${examId}_${studentId}`, fingerprint);
      
      return { passed: true, severity: 'low' };
    } catch (error) {
      console.error('Device fingerprinting failed:', error);
      return {
        passed: false,
        reason: 'Gagal membuat identifikasi perangkat. Periksa pengaturan browser Anda.',
        severity: 'medium'
      };
    }
  };

  const createDeviceFingerprint = async (): Promise<string> => {
    const components = [];
    
    // Screen resolution
    components.push(`${window.screen.width}x${window.screen.height}`);
    
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Language
    components.push(navigator.language);
    
    // Platform
    components.push(navigator.platform);
    
    // User agent
    components.push(navigator.userAgent);
    
    // Canvas fingerprint
    components.push(getCanvasFingerprint());
    
    // WebGL fingerprint
    components.push(getWebGLFingerprint());
    
    // Audio fingerprint (simplified)
    components.push(await getAudioFingerprint());
    
    const fingerprintString = components.join('|');
    return await hashString(fingerprintString);
  };

  const getCanvasFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security check canvas fingerprint', 2, 2);
      
      return canvas.toDataURL();
    } catch (error) {
      return '';
    }
  };

  const getWebGLFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL context not available, skipping WebGL fingerprint');
        return '';
      }

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        console.warn('WebGL debug renderer info not available, skipping WebGL fingerprint');
        return '';
      }

      return (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '~' + 
             (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (error) {
      console.warn('WebGL fingerprint generation failed:', error);
      return '';
    }
  };

  const getAudioFingerprint = async (): Promise<string> => {
    try {
      // Check if AudioContext is available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext not supported on this device, skipping audio fingerprint');
        return '';
      }

      const audioContext = new AudioContextClass();
      
      // Additional check for audioContext creation success
      if (!audioContext) {
        console.warn('Failed to create AudioContext, skipping audio fingerprint');
        return '';
      }

      try {
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();

        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0;
        oscillator.start();

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);

        oscillator.stop();
        await audioContext.close();

        return Array.from(frequencyData).join(',');
      } catch (audioError) {
        console.warn('Error during audio fingerprint generation:', audioError);
        // Ensure audioContext is closed even if there's an error
        try {
          await audioContext.close();
        } catch (closeError) {
          console.warn('Error closing AudioContext:', closeError);
        }
        return '';
      }
    } catch {
      return '';
    }
  };

  const hashString = async (str: string): Promise<string> => {
    try {
      // Check if crypto.subtle is available
      if (!crypto || !crypto.subtle) {
        throw new Error('crypto.subtle not available');
      }
      
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('crypto.subtle not available, using fallback hash method:', error);
      // Fallback: simple hash using btoa
      return btoa(str).substring(0, 32);
    }
  };

  // 4. Security Environment Setup
  const setupSecurityEnvironment = (): SecurityCheckResult => {
    try {
      // Note: Fullscreen will be requested after user gesture
      console.log('SecurityCheck: Fullscreen will be requested after user gesture');

      // Disable context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        logViolation('context_menu_attempt', 'low'); // Reduced severity
      });

      // Disable text selection with mobile-friendly detection
      document.addEventListener('selectstart', (e) => {
        // Allow text selection in input fields and textareas
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea, [contenteditable]')) {
          // Check if this is accidental selection (mobile scrolling, etc.)
          const selection = window.getSelection();
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // More lenient for mobile devices
          if (isMobile) {
            // Only prevent and log if it's substantial text selection
            if (selection && selection.toString().length > 20) {
              e.preventDefault();
              logViolation('text_selection_attempt', 'low');
            }
          } else {
            // Desktop: prevent but only log if selection is more than accidental
            if (selection && selection.toString().length > 5) {
              e.preventDefault();
              logViolation('text_selection_attempt', 'low');
            } else {
              e.preventDefault(); // Still prevent but don't log short selections
            }
          }
        }
      });

      // Disable drag and drop
      document.addEventListener('dragstart', (e) => {
        // Allow drag in input fields for text selection
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea')) {
          e.preventDefault();
          logViolation('drag_attempt', 'low'); // Reduced severity
        }
      });

      return { passed: true, severity: 'low' };

    } catch (error) {
      console.error('Security setup error:', error);
      return {
        passed: false,
        reason: 'Gagal mengatur lingkungan keamanan ujian.',
        severity: 'critical'
      };
    }
  };

  const logViolation = (type: string, severity: string, details?: any) => {
    const violation = {
      type,
      severity,
      timestamp: Date.now(),
      examId,
      studentId,
      details: details || {},
    };

    console.log('SecurityCheck: Logging violation:', violation);
    
    // Store violation for later submission
    const violationsKey = `exam_violations_${examId}_${studentId}`;
    const existingViolations = localStorage.getItem(violationsKey);
    const violations = existingViolations ? JSON.parse(existingViolations) : [];
    violations.push(violation);
    localStorage.setItem(violationsKey, JSON.stringify(violations));
  };

  // Start security checks
  useEffect(() => {
    setIsChecking(true);
  }, []);

  if (needsUserGesture) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Keamanan Terverifikasi
          </h2>
          
          <p className="text-gray-600 mb-6">
            {gestureMessage}
          </p>
          
          <button
            onClick={handleFullscreenGesture}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Monitor className="w-5 h-5" />
            <span>Masuk Mode Fullscreen</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            Mode fullscreen diperlukan untuk menjaga integritas ujian
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={componentRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pemeriksaan Keamanan
          </h1>
          <p className="text-gray-600">
            Memverifikasi lingkungan ujian yang aman
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Check */}
        {currentCheck && (
          <div className="flex items-center justify-center space-x-3 text-gray-700 mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">{currentCheck}</span>
          </div>
        )}

        {/* Security Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Monitoring</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Proteksi</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Wifi className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Koneksi</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600">Verifikasi</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Proses ini memastikan ujian berjalan dengan fair dan aman
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityCheck;
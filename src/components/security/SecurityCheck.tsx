import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Shield, Wifi, Monitor, Lock, Eye } from 'lucide-react';
        // Handle fullscreen exit with proper user gesture requirement
        handleFullscreenExit();
      }
    };
  }, []);

  const updateProgress = (checkName: string, progressValue: number) => {
    setCurrentCheck(checkName);
    setProgress(Math.min(progressValue, 100)); // Ensure progress never exceeds 100%
  };

  // Add global type declaration for our custom properties
  declare global {
    interface Window {
      lastConsoleCheck?: number;
    }
  }

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
      setIsChecking(false);
      
      // Self-destruct: Remove this component from DOM after use
      setTimeout(() => {
        if (componentRef.current) {
          componentRef.current.remove();
        }
      }, 1000);
      
      onSecurityPassed();

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

    // Method 3: Console API Detection (fixed logic)
    try {
      let consoleDetected = false;
      
      // Check if console methods have been overridden (common in DevTools)
      const originalLog = console.log;
      const testObj = { toString: () => { consoleDetected = true; return 'test'; } };
      
      // Only trigger if DevTools console is actually open and expanding objects
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        // Don't trigger our own detection
        return originalConsoleLog.apply(console, args);
      };
      
      // This will only trigger toString if DevTools console is open and expanding
      setTimeout(() => {
        if (typeof console.table === 'function') {
          try {
            console.table([testObj]);
          } catch (e) {
            // Ignore errors
          }
        }
      }, 10);
      
      setTimeout(() => {
        if (consoleDetected) {
          devtoolsScore += 20;
        }
        console.log = originalConsoleLog;
      }, 50);
      
    } catch (error) {
      console.warn('Console detection failed:', error);
    }

    // Method 4: DevTools-specific API Detection
    try {
      // Check for DevTools-specific globals
      const devtoolsGlobals = [
        'devtools',
        '__REACT_DEVTOOLS_GLOBAL_HOOK__',
        '__VUE_DEVTOOLS_GLOBAL_HOOK__'
      ];
      
      let globalCount = 0;
      devtoolsGlobals.forEach(global => {
        if (window.hasOwnProperty(global)) {
          globalCount++;
        }
      });
      
      if (globalCount > 0) {
        devtoolsScore += 15; // Lower score as these might be legitimate dev tools
      }
    } catch (error) {
      console.warn('DevTools API detection failed:', error);
    }

    // Method 5: Firebug/DevTools Detection via Error Stack
    try {
      const error = new Error();
      const stack = error.stack || '';
      
      // Look for DevTools-specific stack traces
      const devtoolsPatterns = [
        'chrome-extension://',
        'moz-extension://',
        'webkit-masked-url://',
        'devtools://'
      ];
      
      let patternMatches = 0;
      devtoolsPatterns.forEach(pattern => {
        if (stack.includes(pattern)) {
          patternMatches++;
        }
      });
      
      if (patternMatches > 0) {
        devtoolsScore += 10;
      }
    } catch (error) {
      console.warn('Stack trace detection failed:', error);
    }

    console.log('DevTools detection score:', devtoolsScore, '/', maxScore);

    if (devtoolsScore >= threshold) {
      return {
        passed: false,
        reason: `Developer Tools kemungkinan terbuka (confidence: ${Math.round(devtoolsScore/maxScore*100)}%). Ujian tidak dapat dilanjutkan untuk menjaga integritas.`,
        severity: 'critical'
      };
    }

    // Add warning if score is moderate
    if (devtoolsScore >= 40) {
      console.warn('Moderate DevTools detection score:', devtoolsScore);
    }

    return { passed: true, severity: 'low' };
  };

  // 2. WebDriver Detection
  const checkWebDriver = (): SecurityCheckResult => {
    // Check for webdriver properties
    if (navigator.webdriver) {
      return {
        passed: false,
        reason: 'Automated browser terdeteksi. Ujian harus dilakukan dengan browser manual.',
        severity: 'critical'
      };
    }

    // Check for common automation frameworks
    const automationIndicators = [
      'webdriver',
      'driver-evaluate',
      'webdriver-evaluate',
      'selenium',
      'webdriver-evaluate-response',
      '__webdriver_script_fn',
      '__selenium_unwrapped',
      '__webdriver_unwrapped',
      '__driver_evaluate',
      '__webdriver_evaluate',
      '__selenium_evaluate',
      '__fxdriver_evaluate',
      '__driver_unwrapped',
      '__fxdriver_unwrapped',
      '_Selenium_IDE_Recorder',
      '_selenium',
      'calledSelenium',
      '$cdc_asdjflasutopfhvcZLmcfl_',
      '$chrome_asyncScriptInfo',
      '__$webdriverAsyncExecutor'
    ];

    for (const indicator of automationIndicators) {
      if (window.hasOwnProperty(indicator) || document.hasOwnProperty(indicator)) {
        return {
          passed: false,
          reason: 'Automated browser terdeteksi. Ujian harus dilakukan dengan browser manual.',
          severity: 'critical'
        };
      }
    }

    // Check for phantom.js
    if (window.callPhantom || window._phantom) {
      return {
        passed: false,
        reason: 'Headless browser terdeteksi. Ujian tidak dapat dilanjutkan.',
        severity: 'critical'
      };
    }

    // Check for unusual navigator properties
    if (navigator.languages && navigator.languages.length === 0) {
      return {
        passed: false,
        reason: 'Browser environment tidak valid.',
        severity: 'critical'
      };
    }

    return { passed: true, severity: 'low' };
  };

  // 3. Device Fingerprinting
  const generateDeviceFingerprint = async (): SecurityCheckResult => {
    try {
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        connection: (navigator as any).connection?.effectiveType,
        canvas: await getCanvasFingerprint(),
        webgl: getWebGLFingerprint(),
        audio: await getAudioFingerprint()
      };

      const fingerprintString = JSON.stringify(fingerprint);
      
      let fingerprintHash: string;
      try {
        fingerprintHash = await hashString(fingerprintString);
      } catch (hashError) {
        console.warn('Failed to generate fingerprint hash, using fallback method:', hashError);
        // Fallback: use a simple hash based on available data
        fingerprintHash = btoa(fingerprintString).substring(0, 32);
      }

      // Store fingerprint
      const deviceKey = `device_fingerprint_${examId}_${studentId}`;
      
      let existingFingerprint: string | null = null;
      try {
        existingFingerprint = localStorage.getItem(deviceKey);
      } catch (storageError) {
        console.warn('localStorage not available, skipping fingerprint comparison:', storageError);
        // If localStorage is not available, we'll allow the exam to proceed
        // This is important for compatibility with some mobile browsers or private browsing modes
      }

      if (existingFingerprint && existingFingerprint !== fingerprintHash) {
        console.warn('Device fingerprint mismatch detected');
        console.log('Previous fingerprint:', existingFingerprint);
        console.log('Current fingerprint:', fingerprintHash);
        
        // Instead of failing immediately, we'll log this as a warning
        // and allow the exam to proceed. This prevents legitimate users
        // from being blocked due to minor browser/device variations
        console.warn('Device fingerprint changed, but allowing exam to proceed for compatibility');
      }

      // Store the new fingerprint
      try {
        localStorage.setItem(deviceKey, fingerprintHash);
      } catch (storageError) {
        console.warn('Failed to store device fingerprint:', storageError);
        // Continue anyway - this is not critical for exam functionality
      }
      
      return { passed: true, severity: 'low' };

    } catch (error) {
      console.error('Fingerprinting error:', error);
      
      // Instead of failing the entire security check, we'll log the error
      // and allow the exam to proceed. This ensures compatibility across devices.
      console.warn('Device fingerprinting failed, but allowing exam to proceed for compatibility');
      return { passed: true, severity: 'low' };
    }
  };

  const getCanvasFingerprint = async (): Promise<string> => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('Canvas 2D context not available, skipping canvas fingerprint');
        return '';
      }

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security Check Canvas', 2, 2);
      return canvas.toDataURL();
    } catch (error) {
      console.warn('Canvas fingerprint generation failed:', error);
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

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        console.warn('WebGL debug renderer info not available, skipping WebGL fingerprint');
        return '';
      }

      return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + '~' + 
             gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
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
      // Force fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((error) => {
          console.warn('Fullscreen request failed:', error);
          // Don't fail the security check just because fullscreen failed
          // Some browsers or security policies might block this
        });
      }

      // Disable context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        logViolation('context_menu_attempt', 'low'); // Reduced severity
      });

      // Disable text selection
      document.addEventListener('selectstart', (e) => {
        // Allow text selection in input fields and textareas
        const target = e.target as HTMLElement;
        if (!target.matches('input, textarea, [contenteditable]')) {
          e.preventDefault();
          logViolation('text_selection_attempt', 'low');
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

      // Disable keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        const forbiddenKeys = [
          'F12', // DevTools
          // Removed F5 and F11 as they might be needed
        ];

        const forbiddenCombinations = [
          { ctrl: true, shift: true, key: 'I' }, // DevTools
          { ctrl: true, shift: true, key: 'J' }, // Console
          { ctrl: true, shift: true, key: 'C' }, // Inspector
          { ctrl: true, key: 'U' }, // View Source
          // Removed common shortcuts that might be needed for legitimate use
          { alt: true, key: 'Tab' }, // Alt+Tab
          { alt: true, key: 'F4' },  // Alt+F4
        ];

        if (forbiddenKeys.includes(e.key)) {
          e.preventDefault();
          logViolation('forbidden_key', 'medium', { key: e.key }); // Reduced severity
          return false;
        }

        for (const combo of forbiddenCombinations) {
          if (
            (combo.ctrl === undefined || combo.ctrl === e.ctrlKey) &&
            (combo.shift === undefined || combo.shift === e.shiftKey) &&
            (combo.alt === undefined || combo.alt === e.altKey) &&
            combo.key.toLowerCase() === e.key.toLowerCase()
          ) {
            e.preventDefault();
            logViolation('forbidden_combination', 'medium', { // Reduced severity
              combination: `${combo.ctrl ? 'Ctrl+' : ''}${combo.shift ? 'Shift+' : ''}${combo.alt ? 'Alt+' : ''}${combo.key}` 
            });
            return false;
          }
        }
      });

      // Prevent zoom
      document.addEventListener('wheel', (e) => {
        if (e.ctrlKey && Math.abs(e.deltaY) > 0) {
          e.preventDefault();
          logViolation('zoom_attempt', 'low'); // Reduced severity
        }
      });

      return { passed: true, severity: 'low' };

    } catch (error) {
      console.warn('AudioContext not available or failed to initialize:', error);
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
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage
    const violationsKey = `exam_violations_${examId}_${studentId}`;
    const existingViolations = JSON.parse(localStorage.getItem(violationsKey) || '[]');
    existingViolations.push(violation);
    localStorage.setItem(violationsKey, JSON.stringify(existingViolations));

    // Also store in sessionStorage as backup
    const sessionViolationsKey = `session_violations_${examId}_${studentId}`;
    const sessionViolations = JSON.parse(sessionStorage.getItem(sessionViolationsKey) || '[]');
    sessionViolations.push(violation);
    sessionStorage.setItem(sessionViolationsKey, JSON.stringify(sessionViolations));

    console.warn('Security violation logged:', violation);
  };

  const handleFullscreenExit = () => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      // Show user-friendly prompt instead of forcing fullscreen
      const userConfirmed = window.confirm(
        'Mode fullscreen diperlukan untuk ujian. Klik OK untuk masuk kembali ke mode fullscreen, atau Cancel untuk menghentikan ujian.'
      );
      
      if (userConfirmed) {
        // User agreed to re-enter fullscreen
        const enterFullscreen = () => {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((error) => {
              console.error('Failed to re-enter fullscreen:', error);
              onSecurityFailed('Gagal masuk kembali ke mode fullscreen. Ujian dihentikan.');
            });
          } else {
            onSecurityFailed('Browser tidak mendukung mode fullscreen. Ujian dihentikan.');
          }
        };
        
        // Add click event listener for user gesture
        document.addEventListener('click', enterFullscreen, { once: true });
        
        // Show instruction to user
        alert('Klik di mana saja pada halaman untuk masuk ke mode fullscreen.');
      } else {
        // User declined to re-enter fullscreen
        onSecurityFailed('Mode fullscreen diperlukan untuk ujian. Ujian dihentikan.');
      }
    }, 100); // Small delay to avoid setState during render
  };

  if (!isChecking) {
    return null;
  }

  return (
    <div 
      ref={componentRef}
      className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center z-50"
      style={{ 
        // Make it harder to inspect this element
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Security Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pemeriksaan Keamanan
          </h2>
          <p className="text-gray-600 mb-8">
            Memverifikasi lingkungan ujian untuk memastikan integritas
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Check */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-gray-700 font-medium">{currentCheck}</span>
          </div>

          {/* Security Features List */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>DevTools Block</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Monitoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Security Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Device Check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCheck;


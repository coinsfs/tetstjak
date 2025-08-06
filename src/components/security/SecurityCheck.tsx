// Fixed DevTools Detection
const checkDevTools = (): SecurityCheckResult => {
  let devtools = false;
  let detectionCount = 0;

  // Method 1: Window Size Check (IMPROVED)
  const checkWindowSize = () => {
    const threshold = 200; // Increased threshold
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // More lenient check - both dimensions must be suspicious
    if (widthDiff > threshold && heightDiff > threshold) {
      detectionCount++;
      return true;
    }
    
    // Check for docked devtools (common pattern)
    if (widthDiff > 300 || heightDiff > 300) {
      detectionCount++;
      return true;
    }
    
    return false;
  };

  // Method 2: Console Detection (SAFER)
  const checkConsoleAccess = () => {
    try {
      let element = document.createElement('div');
      let consoleOpened = false;
      
      Object.defineProperty(element, 'id', {
        get: function() {
          consoleOpened = true;
          return 'devtools-check';
        }
      });
      
      // Use console.dir instead of console.log (less intrusive)
      console.dir(element);
      
      // Small delay to let getter execute
      setTimeout(() => {
        if (consoleOpened) {
          detectionCount++;
        }
      }, 10);
      
      return consoleOpened;
    } catch (e) {
      return false;
    }
  };

  // Method 3: Timing-based Detection (IMPROVED)
  const checkDebuggerTiming = () => {
    try {
      let start = performance.now();
      
      // Use eval to avoid direct debugger statement
      eval('debugger');
      
      let end = performance.now();
      
      // Higher threshold to avoid false positives
      if (end - start > 200) { // Increased from 100 to 200
        detectionCount++;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Method 4: Check for DevTools-specific properties
  const checkDevToolsProperties = () => {
    const devToolsProps = [
      'webkitStorageInfo',
      'webkitIndexedDB',
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__VUE_DEVTOOLS_GLOBAL_HOOK__',
      'devtools'
    ];
    
    let foundProps = 0;
    devToolsProps.forEach(prop => {
      if (window.hasOwnProperty(prop)) {
        foundProps++;
      }
    });
    
    // Only flag if multiple properties found
    if (foundProps >= 2) {
      detectionCount++;
      return true;
    }
    return false;
  };

  // Method 5: Check screen availability vs window size
  const checkScreenRatio = () => {
    const availableRatio = screen.availWidth / screen.availHeight;
    const windowRatio = window.innerWidth / window.innerHeight;
    const ratioDiff = Math.abs(availableRatio - windowRatio);
    
    // If window is significantly smaller than available screen
    if (ratioDiff > 0.5 && (window.innerWidth < screen.availWidth * 0.7 || 
        window.innerHeight < screen.availHeight * 0.7)) {
      detectionCount++;
      return true;
    }
    return false;
  };

  // Run all checks
  try {
    checkWindowSize();
    checkConsoleAccess();
    
    // Only run timing check if other methods haven't detected anything
    if (detectionCount === 0) {
      checkDebuggerTiming();
    }
    
    checkDevToolsProperties();
    checkScreenRatio();
    
    // Require at least 2 positive detections to minimize false positives
    devtools = detectionCount >= 2;
    
  } catch (error) {
    console.warn('DevTools detection error:', error);
    // If detection fails, assume safe
    devtools = false;
  }

  if (devtools) {
    return {
      passed: false,
      reason: `Developer Tools terdeteksi terbuka (confidence: ${detectionCount}/5). Ujian tidak dapat dilanjutkan untuk menjaga integritas.`,
      severity: 'critical'
    };
  }

  return { passed: true, severity: 'low' };
};

// Alternative: Less Aggressive Detection (RECOMMENDED)
const checkDevToolsLenient = (): SecurityCheckResult => {
  // Only check for obvious signs
  const isDevToolsOpen = () => {
    // Check for extreme window size differences
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // Very conservative thresholds
    if (widthDiff > 500 || heightDiff > 500) {
      return true;
    }
    
    // Check for development mode indicators
    if (process.env.NODE_ENV === 'development') {
      return false; // Skip in development
    }
    
    // Check for React DevTools specifically
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.isDisabled === false) {
      return true;
    }
    
    return false;
  };

  if (isDevToolsOpen()) {
    return {
      passed: false,
      reason: 'Developer Tools terdeteksi. Mohon tutup Developer Tools untuk melanjutkan ujian.',
      severity: 'critical'
    };
  }

  return { passed: true, severity: 'low' };
};
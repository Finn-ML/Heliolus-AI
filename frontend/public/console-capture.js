/**
 * Console Log Capture for Frontend Debugging
 * Intercepts console.log/error/warn and stores in localStorage
 * View logs at: /extraction-debug.html
 */

(function() {
  const MAX_LOG_ENTRIES = 500;
  const STORAGE_KEY = 'EXTRACTION_DEBUG';

  // Initialize log array
  let logs = [];

  // Helper to format timestamp
  function timestamp() {
    return new Date().toISOString();
  }

  // Helper to stringify objects
  function formatArg(arg) {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }

  // Add log entry
  function addLog(level, args) {
    const entry = {
      timestamp: timestamp(),
      level: level,
      message: Array.from(args).map(formatArg).join(' ')
    };

    logs.push(entry);

    // Keep only last MAX_LOG_ENTRIES
    if (logs.length > MAX_LOG_ENTRIES) {
      logs = logs.slice(-MAX_LOG_ENTRIES);
    }

    // Update localStorage
    updateStorage();
  }

  // Update localStorage with formatted logs
  function updateStorage() {
    const formatted = logs.map(entry =>
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    ).join('\n\n');

    try {
      localStorage.setItem(STORAGE_KEY, formatted);
    } catch (e) {
      // Storage full, clear old entries
      logs = logs.slice(-100);
      updateStorage();
    }
  }

  // Save original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  // Override console methods
  console.log = function(...args) {
    addLog('log', args);
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    addLog('error', args);
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    addLog('warn', args);
    originalWarn.apply(console, args);
  };

  console.info = function(...args) {
    addLog('info', args);
    originalInfo.apply(console, args);
  };

  // Add clear function
  window.clearDebugLogs = function() {
    logs = [];
    localStorage.removeItem(STORAGE_KEY);
    console.log('Debug logs cleared');
  };

  // Initial message
  console.log('Console capture initialized. View logs at /extraction-debug.html');
  console.log('To clear logs, run: clearDebugLogs()');
})();

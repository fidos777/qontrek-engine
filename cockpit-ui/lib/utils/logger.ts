// lib/utils/logger.ts
// Event logging utility for audit trail

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEvent {
  timestamp: string;
  event: string;
  level: LogLevel;
  data?: Record<string, unknown>;
}

// Log event to console and optionally to backend
export function logEvent(
  event: string,
  data?: Record<string, unknown>,
  level: LogLevel = 'info'
): void {
  const logEntry: LogEvent = {
    timestamp: new Date().toISOString(),
    event,
    level,
    data,
  };

  // Console logging with appropriate level
  switch (level) {
    case 'error':
      console.error(`[${logEntry.timestamp}] ${event}`, data);
      break;
    case 'warn':
      console.warn(`[${logEntry.timestamp}] ${event}`, data);
      break;
    case 'debug':
      console.debug(`[${logEntry.timestamp}] ${event}`, data);
      break;
    default:
      console.log(`[${logEntry.timestamp}] ${event}`, data);
  }

  // In production, this could send to:
  // - Analytics service (Mixpanel, Amplitude)
  // - Backend API for audit logging
  // - Error tracking (Sentry)

  // Store in session storage for debugging
  try {
    const existingLogs = sessionStorage.getItem('qontrek_event_logs');
    const logs: LogEvent[] = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(logEntry);

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }

    sessionStorage.setItem('qontrek_event_logs', JSON.stringify(logs));
  } catch {
    // Session storage might not be available in some contexts
  }
}

// Convenience functions for different log levels
export const logInfo = (event: string, data?: Record<string, unknown>) =>
  logEvent(event, data, 'info');

export const logWarn = (event: string, data?: Record<string, unknown>) =>
  logEvent(event, data, 'warn');

export const logError = (event: string, data?: Record<string, unknown>) =>
  logEvent(event, data, 'error');

export const logDebug = (event: string, data?: Record<string, unknown>) =>
  logEvent(event, data, 'debug');

// Get all logged events from session
export function getEventLogs(): LogEvent[] {
  try {
    const logs = sessionStorage.getItem('qontrek_event_logs');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

// Clear event logs
export function clearEventLogs(): void {
  try {
    sessionStorage.removeItem('qontrek_event_logs');
  } catch {
    // Ignore errors
  }
}

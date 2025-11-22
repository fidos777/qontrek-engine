// Simple logger utility for Voltek dashboard

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
}

function createLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const entry = createLogEntry('info', message, data);
    console.log(formatLog(entry));
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    const entry = createLogEntry('warn', message, data);
    console.warn(formatLog(entry));
  },

  error: (message: string, data?: Record<string, unknown>) => {
    const entry = createLogEntry('error', message, data);
    console.error(formatLog(entry));
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, data);
      console.debug(formatLog(entry));
    }
  },
};

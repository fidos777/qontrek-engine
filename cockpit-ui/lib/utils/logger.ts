// lib/utils/logger.ts
// Event logging utility

export function logEvent(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT] ${event}`, data || {});
  }
  // In production, this could send to analytics service
  // e.g., analytics.track(event, data);
}

export function logError(error: string, data?: Record<string, unknown>) {
  console.error(`[ERROR] ${error}`, data || {});
}

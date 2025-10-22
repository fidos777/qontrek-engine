// app/lib/event_bridge.ts
// Proof Event Bridge with Debounce & Retry Queue

import { signEvent } from "@/lib/security/signEvent";

interface QueuedEvent {
  type: string;
  payload: Record<string, any>;
  attempts: number;
  nextRetry: number;
}

const DEBOUNCE_MS = 100;
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000]; // Exponential backoff

// Debounce timers by event type
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Retry queue
const retryQueue: QueuedEvent[] = [];
let retryInterval: NodeJS.Timeout | null = null;

/**
 * Emit event with debouncing to prevent flooding
 */
export function emitEventDebounced(
  type: string,
  payload: Record<string, any>,
  prevSignature?: string
): void {
  const key = `${type}:${payload.ref || payload.id || "default"}`;

  // Clear existing debounce timer
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key)!);
  }

  // Set new debounce timer
  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    emitEventImmediate(type, payload, prevSignature);
  }, DEBOUNCE_MS);

  debounceTimers.set(key, timer);
}

/**
 * Emit event immediately (no debounce)
 */
async function emitEventImmediate(
  type: string,
  payload: Record<string, any>,
  prevSignature?: string
): Promise<boolean> {
  try {
    // Sign event with HMAC
    const signed = signEvent(type, payload, prevSignature);

    // Emit to local MCP endpoint
    const localResult = await emitToLocal(signed);

    // Emit to Tower webhook (if configured)
    const towerResult = await emitToTower(signed);

    if (!localResult && !towerResult) {
      // Both failed, add to retry queue
      addToRetryQueue(type, payload);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Event emission failed for ${type}:`, error);
    addToRetryQueue(type, payload);
    return false;
  }
}

/**
 * Emit to local MCP events endpoint
 */
async function emitToLocal(event: any): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:3000/api/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (error) {
    console.warn("Local event emission failed:", error);
    return false;
  }
}

/**
 * Emit to Tower webhook
 */
async function emitToTower(event: any): Promise<boolean> {
  const towerUrl = process.env.TOWER_WEBHOOK_URL;
  if (!towerUrl) {
    return true; // Not configured, skip
  }

  try {
    const response = await fetch(towerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Atlas-Key": process.env.TOWER_SHARED_KEY || "",
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10000),
    });

    return response.ok;
  } catch (error) {
    console.warn("Tower event emission failed:", error);
    return false;
  }
}

/**
 * Add failed event to retry queue
 */
function addToRetryQueue(type: string, payload: Record<string, any>): void {
  retryQueue.push({
    type,
    payload,
    attempts: 0,
    nextRetry: Date.now() + BACKOFF_MS[0],
  });

  // Start retry processor if not running
  if (!retryInterval) {
    startRetryProcessor();
  }
}

/**
 * Process retry queue with exponential backoff
 */
function startRetryProcessor(): void {
  retryInterval = setInterval(() => {
    const now = Date.now();
    const pending = retryQueue.filter((e) => e.nextRetry <= now);

    for (const event of pending) {
      if (event.attempts >= MAX_RETRIES) {
        // Max retries reached, remove from queue
        const index = retryQueue.indexOf(event);
        retryQueue.splice(index, 1);
        console.error(`Event dropped after ${MAX_RETRIES} retries:`, event.type);
        continue;
      }

      // Retry emission
      emitEventImmediate(event.type, event.payload).then((success) => {
        if (success) {
          // Remove from queue on success
          const index = retryQueue.indexOf(event);
          if (index !== -1) {
            retryQueue.splice(index, 1);
          }
        } else {
          // Schedule next retry with exponential backoff
          event.attempts++;
          const backoffMs = BACKOFF_MS[Math.min(event.attempts, BACKOFF_MS.length - 1)];
          event.nextRetry = Date.now() + backoffMs;
        }
      });
    }

    // Stop processor if queue is empty
    if (retryQueue.length === 0 && retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
  }, 1000); // Check every second
}

/**
 * Get retry queue stats
 */
export function getRetryQueueStats(): {
  size: number;
  events: Array<{ type: string; attempts: number }>;
} {
  return {
    size: retryQueue.length,
    events: retryQueue.map((e) => ({ type: e.type, attempts: e.attempts })),
  };
}

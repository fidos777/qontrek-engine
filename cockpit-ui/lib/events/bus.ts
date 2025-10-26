// lib/events/bus.ts
// Tiny event emitter for application-wide events

type EventHandler<T = any> = (payload: T) => void;
type EventMap = Map<string, Set<EventHandler>>;

const events: EventMap = new Map();

/**
 * Subscribe to an event
 */
export function on<T = any>(type: string, handler: EventHandler<T>): void {
  if (!events.has(type)) {
    events.set(type, new Set());
  }
  events.get(type)!.add(handler);
}

/**
 * Unsubscribe from an event
 */
export function off<T = any>(type: string, handler: EventHandler<T>): void {
  const handlers = events.get(type);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      events.delete(type);
    }
  }
}

/**
 * Emit an event to all subscribers
 */
export function emit<T = any>(type: string, payload: T): void {
  const handlers = events.get(type);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Event handler error for "${type}":`, err);
      }
    });
  }
}

/**
 * Remove all listeners for a specific event type, or all events if no type specified
 */
export function clear(type?: string): void {
  if (type) {
    events.delete(type);
  } else {
    events.clear();
  }
}

/**
 * Get the number of listeners for a specific event type
 */
export function listenerCount(type: string): number {
  return events.get(type)?.size ?? 0;
}

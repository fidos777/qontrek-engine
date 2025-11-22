export type GovernanceEvent =
  | { type: 'proof.sync'; data: { freshness: number; source: string } }
  | { type: 'tower.receipt'; data: { receiptId: string; timestamp: string } }
  | { type: 'ai.suggestion'; data: { leadId: string; action: string; confidence: number } }
  | { type: 'recovery.success'; data: { leadId: string; amount: number } };

type EventCallback = (event: GovernanceEvent) => void;

class GovernanceEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: GovernanceEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }

    // Also dispatch to window for global access
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('governance-event', {
          detail: event,
        })
      );
    }
  }
}

export const governanceEvents = new GovernanceEventBus();

// Make it globally accessible for testing
if (typeof window !== 'undefined') {
  (window as any).governanceEvents = governanceEvents;
}

/**
 * Governance Event Bus
 * R1.5.2 - Event system for Tower governance, proofs, and AI suggestions
 */

export type GovernanceEvent =
  | { type: 'proof.sync'; data: { freshness: number; source: string } }
  | { type: 'tower.receipt'; data: { receiptId: string; timestamp: string } }
  | { type: 'ai.suggestion'; data: { leadId: string; action: string; confidence: number; reasoning: string } }
  | { type: 'recovery.success'; data: { leadId: string; amount: number } }
  | { type: 'badge.cycle'; data: { badgeId: string; name: string } };

/**
 * Event bus for governance layer communication
 * Supports both internal callbacks and DOM CustomEvents for external integration
 */
class GovernanceEventBus {
  private listeners = new Map<string, Set<(e: GovernanceEvent) => void>>();

  /**
   * Subscribe to governance events
   */
  on(type: string, callback: (e: GovernanceEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Unsubscribe from governance events
   */
  off(type: string, callback: (e: GovernanceEvent) => void) {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Emit event to all subscribers and DOM
   * Dispatches both internal callbacks and CustomEvent for external listeners
   */
  emit(event: GovernanceEvent) {
    // Internal listeners
    const set = this.listeners.get(event.type);
    set?.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        console.error(`Error in governance event listener for ${event.type}:`, error);
      }
    });

    // DOM CustomEvent for external integration
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event.type, { detail: event }));
    }
  }

  /**
   * Get count of active listeners for a given event type
   */
  getListenerCount(type: string): number {
    return this.listeners.get(type)?.size || 0;
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clear() {
    this.listeners.clear();
  }
}

// Singleton instance
export const governanceEvents = new GovernanceEventBus();

// Helper functions for common events
export const emitProofSync = (freshness: number, source: string) => {
  governanceEvents.emit({
    type: 'proof.sync',
    data: { freshness, source }
  });
};

export const emitTowerReceipt = (receiptId: string, timestamp: string) => {
  governanceEvents.emit({
    type: 'tower.receipt',
    data: { receiptId, timestamp }
  });
};

export const emitAISuggestion = (
  leadId: string,
  action: string,
  confidence: number,
  reasoning: string
) => {
  governanceEvents.emit({
    type: 'ai.suggestion',
    data: { leadId, action, confidence, reasoning }
  });
};

export const emitRecoverySuccess = (leadId: string, amount: number) => {
  governanceEvents.emit({
    type: 'recovery.success',
    data: { leadId, amount }
  });
};

export const emitBadgeCycle = (badgeId: string, name: string) => {
  governanceEvents.emit({
    type: 'badge.cycle',
    data: { badgeId, name }
  });
};

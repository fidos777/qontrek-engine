/**
 * Voltek Snapshot Store
 *
 * Manages current and previous KPI snapshots for impact tracking.
 * Used to show before/after deltas when imports complete.
 */

export interface Snapshot {
  recovery_rate_7d: number;
  success_rate: number;
  trust_index: number;
  timestamp: string;
}

let currentSnapshot: Snapshot | null = null;
let previousSnapshot: Snapshot | null = null;

/**
 * Get the current snapshot
 */
export function getSnapshot(): Snapshot | null {
  return currentSnapshot;
}

/**
 * Get the previous snapshot (before last update)
 */
export function getPrevSnapshot(): Snapshot | null {
  return previousSnapshot;
}

/**
 * Update snapshots - saves current as previous, sets new current
 */
export function updateSnapshot(newSnapshot: Snapshot): void {
  if (currentSnapshot) {
    previousSnapshot = currentSnapshot;
  }
  currentSnapshot = newSnapshot;
}

/**
 * Initialize from data sources
 */
export function initializeSnapshot(data: {
  recovery_rate_7d?: number;
  success_rate?: number;
  trust_index?: number;
}): void {
  const snapshot: Snapshot = {
    recovery_rate_7d: data.recovery_rate_7d ?? 0,
    success_rate: data.success_rate ?? 0,
    trust_index: data.trust_index ?? 0,
    timestamp: new Date().toISOString(),
  };

  updateSnapshot(snapshot);
}

/**
 * Reset all snapshots (useful for testing)
 */
export function resetSnapshots(): void {
  currentSnapshot = null;
  previousSnapshot = null;
}

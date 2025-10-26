// lib/state/voltekStore.ts
// Simple state store for Voltek project data

import type { VoltekProject } from "@/lib/data/ingest/voltek";
import { createHash } from "crypto";

export interface VoltekSnapshot {
  dataset: VoltekProject[];
  origin: string; // "import" | "api" | "cache"
  timestamp: number;
  hash: string;
  count: number;
}

type Listener = (snapshot: VoltekSnapshot | null) => void;

// In-memory store
let currentSnapshot: VoltekSnapshot | null = null;
const listeners = new Set<Listener>();

/**
 * Set a new snapshot in the store
 */
export function setSnapshot(dataset: VoltekProject[], origin: string): VoltekSnapshot {
  const timestamp = Date.now();
  const hash = computeHash(dataset);

  const snapshot: VoltekSnapshot = {
    dataset,
    origin,
    timestamp,
    hash,
    count: dataset.length,
  };

  currentSnapshot = snapshot;

  // Notify all subscribers
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error("Listener error:", err);
    }
  });

  return snapshot;
}

/**
 * Get the current snapshot
 */
export function getSnapshot(): VoltekSnapshot | null {
  return currentSnapshot;
}

/**
 * Subscribe to snapshot changes
 * Returns an unsubscribe function
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Clear the store
 */
export function clearSnapshot(): void {
  currentSnapshot = null;
  listeners.forEach((listener) => {
    try {
      listener(null);
    } catch (err) {
      console.error("Listener error:", err);
    }
  });
}

/**
 * Compute a simple hash of the dataset for integrity checking
 */
function computeHash(dataset: VoltekProject[]): string {
  // Create a deterministic string representation
  const str = JSON.stringify(dataset, Object.keys(dataset).sort());

  // Use a simple hash (in browser, we'll use a basic implementation)
  // In Node.js environment, we could use crypto
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
}

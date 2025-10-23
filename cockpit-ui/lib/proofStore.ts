// lib/proofStore.ts
// In-memory proof store with signal recompute and event emission

import type { G2Fixture, Signals } from "./import/types";
import { computeScore, canonicalStringify } from "./import/types";

export interface ProofStoreState {
  fixture: G2Fixture | null;
  signals: Signals;
  score: number;
  lastUpdated: number | null;
}

type ProofUpdateListener = (state: ProofStoreState) => void;

class ProofStore {
  private state: ProofStoreState = {
    fixture: null,
    signals: {
      etag: undefined,
      ack_age_ms: undefined,
      schema_pass: false,
      freshness_ms: 0,
      mode: "demo",
    },
    score: 0,
    lastUpdated: null,
  };

  private listeners: Set<ProofUpdateListener> = new Set();

  // Get current state
  getState(): ProofStoreState {
    return { ...this.state };
  }

  // Get fixture
  getFixture(): G2Fixture | null {
    return this.state.fixture;
  }

  // Set fixture and recompute signals
  setFixture(fixture: G2Fixture, options?: { mode?: "demo" | "live" }): void {
    const now = Date.now();

    // Compute etag from fixture
    const etag = this.computeEtag(fixture);

    // Update signals
    const signals: Signals = {
      etag,
      ack_age_ms: 0, // Fresh import
      schema_pass: true, // Validated before setting
      freshness_ms: 0, // Just created
      mode: options?.mode || "demo",
    };

    // Update state
    this.state = {
      fixture,
      signals,
      score: computeScore(signals),
      lastUpdated: now,
    };

    // Emit event
    this.emit();
  }

  // Clear fixture
  clearFixture(): void {
    this.state = {
      fixture: null,
      signals: {
        etag: undefined,
        ack_age_ms: undefined,
        schema_pass: false,
        freshness_ms: 0,
        mode: "demo",
      },
      score: 0,
      lastUpdated: null,
    };
    this.emit();
  }

  // Update signals manually
  updateSignals(partialSignals: Partial<Signals>): void {
    this.state.signals = { ...this.state.signals, ...partialSignals };
    this.state.score = computeScore(this.state.signals);
    this.emit();
  }

  // Recompute freshness (call periodically)
  recomputeFreshness(): void {
    if (this.state.lastUpdated) {
      const freshness_ms = Date.now() - this.state.lastUpdated;
      this.state.signals.freshness_ms = freshness_ms;
      this.state.score = computeScore(this.state.signals);
      this.emit();
    }
  }

  // Subscribe to changes
  subscribe(listener: ProofUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Emit to all listeners
  private emit(): void {
    this.listeners.forEach((listener) => listener(this.getState()));

    // Also emit to console for debugging
    console.log("[PROOF.UPDATED]", {
      timestamp: new Date().toISOString(),
      score: this.state.score,
      signals: this.state.signals,
      hasFixture: !!this.state.fixture,
    });
  }

  // Compute etag from fixture
  private computeEtag(fixture: G2Fixture): string {
    const canonical = canonicalStringify(fixture);
    // Simple hash function (for production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      const char = canonical.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `etag-${Math.abs(hash).toString(16)}`;
  }
}

// Singleton instance
export const proofStore = new ProofStore();

// React hook for using proof store
export function useProofStore(selector?: (state: ProofStoreState) => any) {
  const [state, setState] = React.useState(proofStore.getState());

  React.useEffect(() => {
    const unsubscribe = proofStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return selector ? selector(state) : state;
}

// Note: Import React for the hook
import * as React from "react";

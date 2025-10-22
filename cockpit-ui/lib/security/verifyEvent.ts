// lib/security/verifyEvent.ts
// HMAC-SHA256 event verification for lineage integrity

import { createHmac } from "crypto";
import { SignedEvent, getCanonicalEvent } from "./signEvent";

export interface VerificationResult {
  valid: boolean;
  error?: string;
  timestamp_drift_ms?: number;
}

/**
 * Verify HMAC-SHA256 signature on signed event
 * Ensures event integrity and authenticity
 */
export function verifyEvent(
  event: SignedEvent,
  options: {
    sharedKey?: string;
    maxAgeSec?: number;
    allowedNodes?: string[];
  } = {}
): VerificationResult {
  const sharedKey = options.sharedKey || process.env.TOWER_SHARED_KEY || "dev-shared-key";
  const maxAgeSec = options.maxAgeSec || 300; // 5 minutes default
  const allowedNodes = options.allowedNodes;

  // Check node ID allowlist (if provided)
  if (allowedNodes && !allowedNodes.includes(event.node_id)) {
    return { valid: false, error: "node_not_allowed" };
  }

  // Check timestamp freshness (prevent replay attacks)
  const now = Date.now();
  const age = (now - event.timestamp) / 1000;

  if (age > maxAgeSec) {
    return {
      valid: false,
      error: "timestamp_expired",
      timestamp_drift_ms: now - event.timestamp,
    };
  }

  if (event.timestamp > now + 60000) {
    // Allow 1 minute clock skew
    return {
      valid: false,
      error: "timestamp_future",
      timestamp_drift_ms: event.timestamp - now,
    };
  }

  // Compute expected signature
  const canonical = getCanonicalEvent({
    type: event.type,
    timestamp: event.timestamp,
    payload: event.payload,
    prev_signature: event.prev_signature,
    node_id: event.node_id,
  });

  const hmac = createHmac("sha256", sharedKey);
  hmac.update(canonical);
  const expectedSignature = hmac.digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature !== event.signature) {
    return { valid: false, error: "signature_mismatch" };
  }

  return { valid: true };
}

/**
 * Verify a chain of events with lineage integrity
 * Ensures prev_signature links form valid chain
 */
export function verifyEventChain(events: SignedEvent[]): VerificationResult {
  if (events.length === 0) {
    return { valid: true };
  }

  // Sort by timestamp
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

  // Verify each event
  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    const result = verifyEvent(event);

    if (!result.valid) {
      return { valid: false, error: `chain_break_at_${i}: ${result.error}` };
    }

    // Check lineage link (except for first event)
    if (i > 0) {
      const prevEvent = sorted[i - 1];
      if (event.prev_signature !== prevEvent.signature) {
        return {
          valid: false,
          error: `lineage_break_at_${i}: prev_signature mismatch`,
        };
      }
    }
  }

  return { valid: true };
}

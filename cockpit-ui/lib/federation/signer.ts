// lib/federation/signer.ts
// Federation ACK signing and verification utilities

import { createHmac, timingSafeEqual } from "crypto";
import { recordClockSkew } from "@/lib/security/healthTracker";
import { seen, record as recordNonce } from "@/lib/security/nonceStore";

export interface FederationACK {
  event_id: string;
  event_type: string;
  timestamp: number;
  nonce: string;
  node_id: string;
  payload: any;
  signature: string;
  prev_signature?: string;
}

export interface SignOptions {
  sharedKey?: string;
  nodeId?: string;
}

export interface VerifyOptions {
  sharedKey?: string;
  maxAgeSec?: number;
  allowedNodes?: string[];
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  clock_skew_ms?: number;
}

/**
 * Get canonical representation of ACK for signing
 */
function getCanonicalACK(ack: Omit<FederationACK, "signature">): string {
  const canonical = {
    type: ack.event_type,
    timestamp: ack.timestamp,
    payload: ack.payload,
    prev_signature: ack.prev_signature || null,
    node_id: ack.node_id,
    nonce: ack.nonce,
  };

  // Serialize with sorted keys
  return JSON.stringify(canonical, Object.keys(canonical).sort());
}

/**
 * Sign a federation ACK with HMAC-SHA256
 */
export function signAck(
  ack: Omit<FederationACK, "signature">,
  options: SignOptions = {}
): FederationACK {
  const sharedKey = options.sharedKey || process.env.FEDERATION_KEY || "dev-federation-key";

  // Get canonical representation
  const canonical = getCanonicalACK(ack);

  // Compute HMAC-SHA256 signature
  const hmac = createHmac("sha256", sharedKey);
  hmac.update(canonical);
  const signature = hmac.digest("hex");

  return {
    ...ack,
    signature,
  };
}

/**
 * Verify a federation ACK signature
 */
export function verifyAck(
  ack: FederationACK,
  options: VerifyOptions = {}
): VerificationResult {
  const sharedKey = options.sharedKey || process.env.FEDERATION_KEY || "dev-federation-key";
  const maxAgeSec = options.maxAgeSec || 300; // 5 minutes default
  const allowedNodes = options.allowedNodes;

  // Check node ID allowlist (if provided)
  if (allowedNodes && !allowedNodes.includes(ack.node_id)) {
    return { valid: false, error: "node_not_allowed" };
  }

  // Check timestamp freshness
  const now = Date.now();
  const age = (now - ack.timestamp) / 1000;
  const clockSkewMs = ack.timestamp - now;

  // Record clock skew for health monitoring
  recordClockSkew(clockSkewMs);

  if (age > maxAgeSec) {
    return {
      valid: false,
      error: "timestamp_expired",
      clock_skew_ms: now - ack.timestamp,
    };
  }

  // Reject timestamps too far in future (>90s)
  if (ack.timestamp > now + 90000) {
    return {
      valid: false,
      error: "timestamp_future",
      clock_skew_ms: clockSkewMs,
    };
  }

  // Check nonce for replay protection
  if (seen(ack.nonce)) {
    return {
      valid: false,
      error: "nonce_replay",
      clock_skew_ms: clockSkewMs,
    };
  }

  // Record nonce with TTL
  recordNonce(ack.nonce, maxAgeSec);

  // Compute expected signature
  const canonical = getCanonicalACK(ack);
  const hmac = createHmac("sha256", sharedKey);
  hmac.update(canonical);
  const expectedSignature = hmac.digest("hex");

  // Constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(ack.signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "signature_mismatch", clock_skew_ms: clockSkewMs };
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { valid: false, error: "signature_mismatch", clock_skew_ms: clockSkewMs };
  }

  return { valid: true, clock_skew_ms: clockSkewMs };
}

/**
 * Compare two nonces for equality (constant-time)
 */
export function compareNonce(nonceA: string, nonceB: string): boolean {
  if (nonceA.length !== nonceB.length) {
    return false;
  }

  const bufferA = Buffer.from(nonceA, "utf8");
  const bufferB = Buffer.from(nonceB, "utf8");

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Verify a chain of ACKs (lineage integrity)
 */
export function verifyAckChain(
  acks: FederationACK[],
  options: VerifyOptions = {}
): VerificationResult {
  if (acks.length === 0) {
    return { valid: true };
  }

  // Sort by timestamp
  const sorted = [...acks].sort((a, b) => a.timestamp - b.timestamp);

  // Verify each ACK
  for (let i = 0; i < sorted.length; i++) {
    const ack = sorted[i];
    const result = verifyAck(ack, options);

    if (!result.valid) {
      return { valid: false, error: `chain_break_at_${i}: ${result.error}` };
    }

    // Check lineage link (except for first ACK)
    if (i > 0) {
      const prevAck = sorted[i - 1];
      if (ack.prev_signature && ack.prev_signature !== prevAck.signature) {
        return {
          valid: false,
          error: `lineage_break_at_${i}: prev_signature mismatch`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Generate a batch ID for idempotency
 */
export function generateBatchId(): string {
  return `batch-${crypto.randomUUID()}`;
}

/**
 * Generate an event ID for ACK
 */
export function generateEventId(): string {
  return `ack-${crypto.randomUUID()}`;
}

/**
 * Generate a nonce for replay protection
 */
export function generateNonce(): string {
  return crypto.randomUUID();
}

/**
 * Validate batch ID format
 */
export function isValidBatchId(batchId: string): boolean {
  return /^batch-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId);
}

/**
 * Validate event ID format
 */
export function isValidEventId(eventId: string): boolean {
  return /^ack-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
}

/**
 * Validate nonce format (UUID v4)
 */
export function isValidNonce(nonce: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nonce);
}

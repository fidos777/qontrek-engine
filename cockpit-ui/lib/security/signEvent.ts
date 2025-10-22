// lib/security/signEvent.ts
// HMAC-SHA256 event signing for lineage integrity

import { createHmac } from "crypto";

export interface SignedEvent {
  type: string;
  timestamp: number;
  payload: Record<string, any>;
  signature: string;
  prev_signature?: string;
  node_id: string;
}

/**
 * Sign an event with HMAC-SHA256 using Tower shared key
 * Creates audit chain with prev_signature for Merkle-like integrity
 */
export function signEvent(
  type: string,
  payload: Record<string, any>,
  prevSignature?: string
): SignedEvent {
  const sharedKey = process.env.TOWER_SHARED_KEY || "dev-shared-key";
  const nodeId = process.env.ATLAS_NODE_ID || "atlas-local";
  const timestamp = Date.now();

  // Canonical representation for signing
  const canonical = JSON.stringify({
    type,
    timestamp,
    payload,
    prev_signature: prevSignature,
    node_id: nodeId,
  });

  // Compute HMAC-SHA256 signature
  const hmac = createHmac("sha256", sharedKey);
  hmac.update(canonical);
  const signature = hmac.digest("hex");

  return {
    type,
    timestamp,
    payload,
    signature,
    prev_signature: prevSignature,
    node_id: nodeId,
  };
}

/**
 * Sign a proof artifact for Tower submission
 */
export function signProof(
  proofRef: string,
  etag: string,
  schema?: string,
  prevSignature?: string
): SignedEvent {
  return signEvent(
    "proof.signed",
    {
      ref: proofRef,
      etag,
      schema,
    },
    prevSignature
  );
}

/**
 * Get canonical representation of event for verification
 */
export function getCanonicalEvent(event: Omit<SignedEvent, "signature">): string {
  return JSON.stringify({
    type: event.type,
    timestamp: event.timestamp,
    payload: event.payload,
    prev_signature: event.prev_signature,
    node_id: event.node_id,
  });
}

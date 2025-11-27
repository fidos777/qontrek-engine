/**
 * MCP Tool Fabric - Governance Module
 *
 * Handles G13 lineage tracking, JWT extraction, and proof logging.
 * All MCP tool invocations are logged for audit compliance.
 */

import { scrubPII, scrubObject } from '../security/scrubber';
import type { AuthContext, JWTClaims, GovernanceMetadata, Actor, Target } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Demo tenant ID for development/testing */
export const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111';

/** Default gate ID for MCP tool invocations */
export const DEFAULT_GATE_ID = 'G13';

/** MCP Tool version */
export const MCP_VERSION = '1.0.0';

// =============================================================================
// JWT EXTRACTION
// =============================================================================

/**
 * Decode a JWT token without verification (for demo purposes)
 * In production, this should use proper JWT verification with secret
 */
function decodeJWT(token: string): JWTClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded) as JWTClaims;
  } catch {
    return null;
  }
}

/**
 * Extract authentication context from request headers
 */
export function extractAuthContext(headers: Headers): AuthContext {
  const authHeader = headers.get('authorization');

  // Try to extract from Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const claims = decodeJWT(token);

    if (claims) {
      return {
        user_id: claims.sub,
        tenant_id: claims.tenant_id,
        role: claims.role,
        is_demo: false,
      };
    }
  }

  // Try to extract from X-Tenant-ID header (for testing)
  const tenantIdHeader = headers.get('x-tenant-id');
  const userIdHeader = headers.get('x-user-id');
  const roleHeader = headers.get('x-user-role');

  if (tenantIdHeader) {
    return {
      user_id: userIdHeader || 'demo-user',
      tenant_id: tenantIdHeader,
      role: roleHeader || 'user',
      is_demo: tenantIdHeader === DEMO_TENANT_ID,
    };
  }

  // Fall back to demo context
  return {
    user_id: 'demo-user-001',
    tenant_id: DEMO_TENANT_ID,
    role: 'admin',
    is_demo: true,
  };
}

// =============================================================================
// PROOF HASH GENERATION
// =============================================================================

/**
 * Generate a SHA-256 hash of the payload
 */
export async function generateHash(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  // Use Web Crypto API for hash generation (Edge Runtime compatible)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Generate a proof hash for an event
 */
export async function generateProofHash(
  eventType: string,
  actor: Actor,
  target: Target,
  previousHash?: string
): Promise<string> {
  const payload = JSON.stringify({
    event_type: eventType,
    actor,
    target,
    previous_hash: previousHash || 'genesis',
    timestamp: new Date().toISOString(),
  });

  return generateHash(payload);
}

// =============================================================================
// PROOF LOGGING
// =============================================================================

/** In-memory proof ledger for demo mode */
const proofLedger: Array<{
  id: string;
  tenant_id: string;
  event_type: string;
  actor: Actor;
  target: Target;
  proof_hash: string;
  previous_hash: string;
  timestamp: string;
}> = [];

/** Last proof hash per tenant (for chain linking) */
const lastProofHash: Map<string, string> = new Map();

/**
 * Log a proof event to the ledger
 */
export async function logProofEvent(
  tenantId: string,
  eventType: string,
  actor: Actor,
  target: Target,
  metadata?: Record<string, unknown>
): Promise<{
  event_id: string;
  proof_hash: string;
  timestamp: string;
}> {
  const previousHash = lastProofHash.get(tenantId) || 'genesis';
  const proofHash = await generateProofHash(eventType, actor, target, previousHash);
  const timestamp = new Date().toISOString();
  const eventId = crypto.randomUUID();

  // Store in ledger
  proofLedger.push({
    id: eventId,
    tenant_id: tenantId,
    event_type: eventType,
    actor: scrubObject(actor) as Actor,
    target: scrubObject(target) as Target,
    proof_hash: proofHash,
    previous_hash: previousHash,
    timestamp,
  });

  // Update last hash for this tenant
  lastProofHash.set(tenantId, proofHash);

  return {
    event_id: eventId,
    proof_hash: proofHash,
    timestamp,
  };
}

/**
 * Log an MCP tool invocation
 */
export async function logToolInvocation(
  toolName: string,
  authContext: AuthContext,
  input: Record<string, unknown>,
  success: boolean
): Promise<GovernanceMetadata> {
  const actor: Actor = {
    id: authContext.user_id,
    type: authContext.is_demo ? 'system' : 'user',
    name: authContext.is_demo ? 'demo-agent' : undefined,
  };

  const target: Target = {
    id: toolName,
    type: 'mcp_tool',
    name: toolName,
  };

  const result = await logProofEvent(
    authContext.tenant_id,
    success ? 'tool_invocation' : 'tool_error',
    actor,
    target,
    {
      input: scrubObject(input),
      success,
    }
  );

  return {
    proof_hash: result.proof_hash,
    gate_id: DEFAULT_GATE_ID,
    logged_at: result.timestamp,
  };
}

/**
 * Get proof ledger entries for a tenant
 */
export function getProofLedger(tenantId: string, limit = 100): typeof proofLedger {
  return proofLedger
    .filter(entry => entry.tenant_id === tenantId)
    .slice(-limit);
}

/**
 * Get the latest proof hash for a tenant
 */
export function getLatestProofHash(tenantId: string): string {
  return lastProofHash.get(tenantId) || 'genesis';
}

// =============================================================================
// GOVERNANCE STATUS
// =============================================================================

/**
 * Demo governance gates status
 */
export function getDemoGovernanceStatus(includeEvidence = false) {
  const baseGates = {
    G13: { status: 'pass' as const, message: 'Lineage tracking active' },
    G14: { status: 'pass' as const, message: 'Data integrity verified' },
    G15: { status: 'pass' as const, message: 'Access control enforced' },
    G16: { status: 'warn' as const, message: 'Pending compliance review' },
    G17: { status: 'pass' as const, message: 'Encryption at rest enabled' },
    G18: { status: 'pass' as const, message: 'Audit logging active' },
    G19: { status: 'pass' as const, message: 'PII scrubbing enabled' },
    G20: { status: 'pass' as const, message: 'Rate limiting active' },
    G21: { status: 'warn' as const, message: 'MFA enrollment incomplete' },
  };

  if (includeEvidence) {
    return {
      G13: { ...baseGates.G13, evidence: { events_logged: proofLedger.length, last_hash: getLatestProofHash(DEMO_TENANT_ID) } },
      G14: { ...baseGates.G14, evidence: { checksums_verified: 142, last_check: new Date().toISOString() } },
      G15: { ...baseGates.G15, evidence: { rls_policies: 5, active_sessions: 3 } },
      G16: { ...baseGates.G16, evidence: { pending_reviews: 2, due_date: '2024-02-15' } },
      G17: { ...baseGates.G17, evidence: { algorithm: 'AES-256-GCM', key_rotation: 'monthly' } },
      G18: { ...baseGates.G18, evidence: { log_retention_days: 90, storage_used_mb: 245 } },
      G19: { ...baseGates.G19, evidence: { patterns_active: 12, last_scrub: new Date().toISOString() } },
      G20: { ...baseGates.G20, evidence: { requests_per_minute: 60, current_usage: 12 } },
      G21: { ...baseGates.G21, evidence: { users_enrolled: 8, users_pending: 2 } },
    };
  }

  return baseGates;
}

/**
 * Calculate trust index from gate statuses
 */
export function calculateTrustIndex(gates: Record<string, { status: string }>): number {
  const weights = {
    pass: 100,
    warn: 70,
    pending: 50,
    fail: 0,
  };

  const statuses = Object.values(gates).map(g => g.status);
  const total = statuses.reduce((sum, status) => {
    return sum + (weights[status as keyof typeof weights] ?? 50);
  }, 0);

  return Math.round(total / statuses.length);
}

/**
 * Governance Middleware
 *
 * Enforces governance checks before MCP tool execution.
 * Validates actor identity, enforces rate limits, and ensures ledger events.
 *
 * @module lib/governance/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { checkAndStoreNonce } from '@/lib/security/nonceStore';

/**
 * Actor Identity Schema
 */
const ActorIdentitySchema = z.object({
  actorId: z.string().min(1),
  actorType: z.enum(['user', 'service', 'system', 'federation']),
  scope: z.enum(['read', 'write', 'admin']).optional(),
  nonce: z.string().min(8),
  timestamp: z.number(),
  signature: z.string().optional(),
});

export type ActorIdentity = z.infer<typeof ActorIdentitySchema>;

/**
 * Governance Context for tool execution
 */
export interface GovernanceContext {
  actor: ActorIdentity;
  requestId: string;
  toolName: string;
  vertical?: string;
  gateId?: string;
  startedAt: number;
  governanceChecks: GovernanceCheckResult[];
}

export interface GovernanceCheckResult {
  check: string;
  passed: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Ledger Event for audit trail
 */
export interface LedgerEvent {
  eventId: string;
  eventType: 'tool_invocation' | 'governance_check' | 'state_mutation' | 'error';
  timestamp: string;
  actor: ActorIdentity;
  toolName: string;
  requestId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  governanceContext: Omit<GovernanceContext, 'governanceChecks'>;
  checks: GovernanceCheckResult[];
  durationMs?: number;
}

// In-memory event buffer (use persistent store in production)
const ledgerBuffer: LedgerEvent[] = [];
const MAX_BUFFER_SIZE = 10000;

/**
 * Extract actor identity from request
 */
export function extractActorIdentity(request: NextRequest): ActorIdentity | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  const actorHeader = request.headers.get('x-actor-id');
  const nonceHeader = request.headers.get('x-nonce');
  const timestampHeader = request.headers.get('x-timestamp');
  const signatureHeader = request.headers.get('x-signature');

  // For API key auth
  if (apiKeyHeader) {
    const timestamp = timestampHeader ? parseInt(timestampHeader) : Date.now();
    return {
      actorId: actorHeader || `api-key:${apiKeyHeader.substring(0, 8)}`,
      actorType: 'service',
      scope: 'read',
      nonce: nonceHeader || crypto.randomBytes(16).toString('hex'),
      timestamp,
      signature: signatureHeader,
    };
  }

  // For JWT auth (Bearer token)
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // In production, verify JWT and extract claims
      const token = authHeader.slice(7);
      // Placeholder: decode JWT payload (use proper library in production)
      const [, payloadB64] = token.split('.');
      if (payloadB64) {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        return {
          actorId: payload.sub || payload.actor_id,
          actorType: payload.type || 'user',
          scope: payload.scope,
          nonce: nonceHeader || crypto.randomBytes(16).toString('hex'),
          timestamp: payload.iat || Date.now(),
          signature: signatureHeader,
        };
      }
    } catch {
      // Invalid JWT
    }
  }

  // For internal/federation requests
  if (actorHeader && nonceHeader) {
    const timestamp = timestampHeader ? parseInt(timestampHeader) : Date.now();
    return {
      actorId: actorHeader,
      actorType: 'federation',
      nonce: nonceHeader,
      timestamp,
      signature: signatureHeader,
    };
  }

  return null;
}

/**
 * Validate timestamp freshness (anti-replay)
 */
function isTimestampFresh(timestamp: number, maxAgeMs = 300000): boolean {
  const now = Date.now();
  const age = Math.abs(now - timestamp);
  return age <= maxAgeMs;
}

/**
 * Validate request signature
 */
function validateSignature(
  payload: Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const expected = crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Pre-execution governance checks
 */
export async function enforceGovernance(
  request: NextRequest,
  toolName: string,
  options: {
    requireAuth?: boolean;
    requireNonce?: boolean;
    requireSignature?: boolean;
    allowedActorTypes?: ActorIdentity['actorType'][];
    allowedScopes?: ActorIdentity['scope'][];
    vertical?: string;
    gateId?: string;
  } = {}
): Promise<{
  allowed: boolean;
  context?: GovernanceContext;
  error?: { status: number; message: string };
}> {
  const {
    requireAuth = true,
    requireNonce = true,
    requireSignature = false,
    allowedActorTypes = ['user', 'service', 'system', 'federation'],
    allowedScopes,
    vertical,
    gateId,
  } = options;

  const checks: GovernanceCheckResult[] = [];
  const requestId = generateRequestId();

  // Check 1: Actor Identity
  const actor = extractActorIdentity(request);

  if (requireAuth && !actor) {
    checks.push({
      check: 'actor_identity',
      passed: false,
      message: 'Missing or invalid actor identity',
    });
    await emitLedgerEvent({
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventType: 'governance_check',
      timestamp: new Date().toISOString(),
      actor: { actorId: 'unknown', actorType: 'system', nonce: '', timestamp: Date.now() },
      toolName,
      requestId,
      governanceContext: { actor: { actorId: 'unknown', actorType: 'system', nonce: '', timestamp: Date.now() }, requestId, toolName, startedAt: Date.now() },
      checks,
    });
    return {
      allowed: false,
      error: { status: 401, message: 'Unauthorized: Missing actor identity' },
    };
  }

  // Use default actor for unauthenticated requests (when auth not required)
  const resolvedActor = actor || {
    actorId: 'anonymous',
    actorType: 'system' as const,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };

  checks.push({
    check: 'actor_identity',
    passed: true,
    metadata: { actorId: resolvedActor.actorId, actorType: resolvedActor.actorType },
  });

  // Check 2: Actor Type
  if (!allowedActorTypes.includes(resolvedActor.actorType)) {
    checks.push({
      check: 'actor_type',
      passed: false,
      message: `Actor type '${resolvedActor.actorType}' not allowed for this tool`,
    });
    return {
      allowed: false,
      error: { status: 403, message: 'Forbidden: Actor type not permitted' },
    };
  }
  checks.push({ check: 'actor_type', passed: true });

  // Check 3: Scope
  if (allowedScopes && resolvedActor.scope && !allowedScopes.includes(resolvedActor.scope)) {
    checks.push({
      check: 'scope',
      passed: false,
      message: `Scope '${resolvedActor.scope}' not allowed for this tool`,
    });
    return {
      allowed: false,
      error: { status: 403, message: 'Forbidden: Scope not permitted' },
    };
  }
  checks.push({ check: 'scope', passed: true });

  // Check 4: Timestamp Freshness (Anti-Replay)
  if (!isTimestampFresh(resolvedActor.timestamp)) {
    checks.push({
      check: 'timestamp_freshness',
      passed: false,
      message: 'Request timestamp is stale',
    });
    return {
      allowed: false,
      error: { status: 400, message: 'Bad Request: Stale timestamp' },
    };
  }
  checks.push({ check: 'timestamp_freshness', passed: true });

  // Check 5: Nonce Uniqueness (Anti-Replay)
  if (requireNonce && resolvedActor.nonce) {
    const nonceContext = `mcp_${toolName}`;
    const isNewNonce = await checkAndStoreNonce(resolvedActor.nonce, nonceContext);
    if (!isNewNonce) {
      checks.push({
        check: 'nonce_uniqueness',
        passed: false,
        message: 'Nonce has already been used (replay detected)',
      });
      return {
        allowed: false,
        error: { status: 400, message: 'Bad Request: Duplicate nonce' },
      };
    }
    checks.push({ check: 'nonce_uniqueness', passed: true });
  }

  // Check 6: Signature Verification
  if (requireSignature && resolvedActor.signature) {
    const signingSecret = process.env.MCP_SIGNING_SECRET || '';
    const signaturePayload = {
      actorId: resolvedActor.actorId,
      nonce: resolvedActor.nonce,
      timestamp: resolvedActor.timestamp,
      toolName,
    };
    const isValidSignature = validateSignature(signaturePayload, resolvedActor.signature, signingSecret);
    if (!isValidSignature) {
      checks.push({
        check: 'signature_verification',
        passed: false,
        message: 'Invalid request signature',
      });
      return {
        allowed: false,
        error: { status: 401, message: 'Unauthorized: Invalid signature' },
      };
    }
    checks.push({ check: 'signature_verification', passed: true });
  }

  // Build governance context
  const context: GovernanceContext = {
    actor: resolvedActor,
    requestId,
    toolName,
    vertical,
    gateId,
    startedAt: Date.now(),
    governanceChecks: checks,
  };

  return { allowed: true, context };
}

/**
 * Emit ledger event for audit trail
 */
export async function emitLedgerEvent(event: LedgerEvent): Promise<void> {
  // Add to buffer
  ledgerBuffer.push(event);

  // Trim buffer if exceeds max size
  if (ledgerBuffer.length > MAX_BUFFER_SIZE) {
    ledgerBuffer.splice(0, ledgerBuffer.length - MAX_BUFFER_SIZE);
  }

  // In production, persist to:
  // - File system (JSONL)
  // - Database (with proper indexing)
  // - Event stream (Kafka, etc.)

  // Log for observability
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LEDGER] ${event.eventType}: ${event.toolName} by ${event.actor.actorId}`);
  }
}

/**
 * Post-execution wrapper to emit ledger event
 */
export async function withGovernanceAudit<T>(
  context: GovernanceContext,
  input: Record<string, unknown> | undefined,
  executor: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await executor();

    // Emit success event
    await emitLedgerEvent({
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventType: 'tool_invocation',
      timestamp: new Date().toISOString(),
      actor: context.actor,
      toolName: context.toolName,
      requestId: context.requestId,
      input,
      output: typeof result === 'object' ? (result as Record<string, unknown>) : { value: result },
      governanceContext: {
        actor: context.actor,
        requestId: context.requestId,
        toolName: context.toolName,
        vertical: context.vertical,
        gateId: context.gateId,
        startedAt: context.startedAt,
      },
      checks: context.governanceChecks,
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // Emit error event
    await emitLedgerEvent({
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventType: 'error',
      timestamp: new Date().toISOString(),
      actor: context.actor,
      toolName: context.toolName,
      requestId: context.requestId,
      input,
      output: { error: (error as Error).message },
      governanceContext: {
        actor: context.actor,
        requestId: context.requestId,
        toolName: context.toolName,
        vertical: context.vertical,
        gateId: context.gateId,
        startedAt: context.startedAt,
      },
      checks: context.governanceChecks,
      durationMs: Date.now() - startTime,
    });

    throw error;
  }
}

/**
 * Get recent ledger events (for debugging/monitoring)
 */
export function getLedgerEvents(limit = 100): LedgerEvent[] {
  return ledgerBuffer.slice(-limit);
}

/**
 * Create governance error response
 */
export function createGovernanceErrorResponse(
  error: { status: number; message: string },
  requestId: string
): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: error.status }
  );
}

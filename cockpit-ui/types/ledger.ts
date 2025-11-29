/**
 * Ledger Event Schema v1.0
 *
 * Comprehensive schema for immutable ledger events with:
 * - Atomic event structure
 * - Actor identity capture
 * - Governance gate binding
 * - Drift history support
 * - Tenant isolation
 */

// ============================================================================
// Core Ledger Event Types
// ============================================================================

/**
 * Event lifecycle states - atomic transitions only
 */
export type LedgerEventStatus =
  | 'pending'      // Event created, not yet validated
  | 'validated'    // Passed governance gate checks
  | 'executed'     // Business logic completed
  | 'sealed'       // Cryptographically sealed
  | 'committed'    // Persisted to ledger
  | 'rejected'     // Failed validation/governance
  | 'rolled_back'; // Compensating transaction applied

/**
 * Governance gate reference for binding events to gates
 */
export interface GovernanceGateRef {
  gateId: string;              // e.g., "G19", "G21"
  gateName: string;            // e.g., "Ledger Automation"
  requiredEvidence: string[];  // Evidence items required
  passedAt?: string;           // ISO timestamp when gate passed
  status: 'pending' | 'pass' | 'fail' | 'waived';
  waiverReason?: string;       // If waived, why
  waiverApprovedBy?: string;   // Actor who approved waiver
}

/**
 * Actor identity - captures who performed the action
 */
export interface ActorIdentity {
  actorId: string;             // Unique actor identifier
  actorType: 'user' | 'service' | 'system' | 'ci' | 'external';
  displayName?: string;        // Human-readable name
  email?: string;              // For user actors
  serviceAccount?: string;     // For service actors
  sessionId?: string;          // Session context
  ipAddress?: string;          // Scrubbed/hashed for privacy
  userAgent?: string;          // Client info
  authMethod: 'jwt' | 'api_key' | 'mTLS' | 'service_token' | 'system';
  authClaims?: Record<string, unknown>; // Relevant auth claims
}

/**
 * Drift tracking - captures state changes over time
 */
export interface DriftRecord {
  fieldPath: string;           // JSON path to changed field
  previousValue: unknown;      // Value before change (scrubbed if PII)
  newValue: unknown;           // Value after change (scrubbed if PII)
  changedAt: string;           // ISO timestamp
  changedBy: string;           // Actor ID who made change
  changeReason?: string;       // Optional justification
}

/**
 * Cryptographic seal for immutability
 */
export interface CryptographicSeal {
  algorithm: 'HMAC-SHA256' | 'RSA-SHA256' | 'ECDSA-P256';
  digest: string;              // Hash of canonical event
  signature: string;           // Signature of digest
  signedBy: string;            // Key ID used for signing
  signedAt: string;            // ISO timestamp
  previousEventHash?: string;  // Chain link to previous event
  merkleRoot?: string;         // Batch merkle root if applicable
}

/**
 * Idempotency context for replay protection
 */
export interface IdempotencyContext {
  idempotencyKey: string;      // Client-provided or generated key
  nonce: string;               // Request nonce
  firstSeenAt: string;         // When first processed
  lastSeenAt: string;          // Most recent attempt
  attemptCount: number;        // Number of attempts
  nonceContext: string;        // Nonce store context key
}

/**
 * Tenant isolation context
 */
export interface TenantContext {
  tenantId: string;            // Brand/tenant identifier
  environment: 'production' | 'staging' | 'development' | 'test';
  region?: string;             // Geographic region if applicable
  partition?: string;          // Data partition for sharding
  isolationLevel: 'strict' | 'shared_read' | 'federated';
}

/**
 * Parent-child event relationship for saga/workflow support
 */
export interface EventRelation {
  parentEventId?: string;      // Parent event if part of saga
  correlationId: string;       // Traces related events
  causationId?: string;        // Event that caused this one
  sagaId?: string;             // Saga/workflow identifier
  sagaStep?: number;           // Step in saga sequence
  compensatingFor?: string;    // If rollback, what event
}

/**
 * Core Ledger Event - atomic unit of change
 */
export interface LedgerEvent {
  // === Identity ===
  eventId: string;              // Globally unique event ID (UUIDv7 recommended)
  eventType: string;            // Domain event type (e.g., "federation.batch_sync")
  eventVersion: string;         // Schema version (semver)

  // === Timestamps ===
  createdAt: string;            // When event was created (ISO 8601)
  validatedAt?: string;         // When governance validated
  executedAt?: string;          // When business logic ran
  sealedAt?: string;            // When cryptographically sealed
  committedAt?: string;         // When persisted to ledger

  // === Status ===
  status: LedgerEventStatus;

  // === Actor (WHO did this) ===
  actor: ActorIdentity;

  // === Tenant (WHERE/context) ===
  tenant: TenantContext;

  // === Governance (WHY allowed) ===
  governanceGates: GovernanceGateRef[];

  // === Payload (WHAT happened) ===
  payload: {
    action: string;             // Specific action taken
    resourceType: string;       // Type of resource affected
    resourceId: string;         // ID of affected resource
    data: Record<string, unknown>; // Action-specific data
    metadata?: Record<string, unknown>; // Additional context
  };

  // === Relationships ===
  relations: EventRelation;

  // === Drift History (HOW it changed) ===
  driftHistory: DriftRecord[];

  // === Idempotency ===
  idempotency: IdempotencyContext;

  // === Cryptographic Seal ===
  seal?: CryptographicSeal;

  // === Proof Emission ===
  proofPath?: string;           // Path to emitted proof file
  proofHash?: string;           // Hash of proof content
}

// ============================================================================
// Specialized Event Types
// ============================================================================

/**
 * Federation sync event - for batch operations
 */
export interface FederationSyncEvent extends LedgerEvent {
  eventType: 'federation.batch_sync';
  payload: LedgerEvent['payload'] & {
    action: 'sync' | 'resync' | 'recover';
    resourceType: 'federation_batch';
    data: {
      batchId: string;
      batchSize: number;
      sourceNode: string;
      targetNodes: string[];
      skewMs?: number;
      merkleRoot: string;
    };
  };
}

/**
 * Tower receipt event - for proof uploads
 */
export interface TowerReceiptEvent extends LedgerEvent {
  eventType: 'tower.receipt';
  payload: LedgerEvent['payload'] & {
    action: 'upload' | 'verify' | 'reject';
    resourceType: 'tower_receipt';
    data: {
      receiptId: string;
      manifestHash: string;
      echoRoot: string;
      factorySignature: string;
      towerSignature: string;
      fileCount: number;
    };
  };
}

/**
 * Key rotation event - for security tracking
 */
export interface KeyRotationEvent extends LedgerEvent {
  eventType: 'security.key_rotation';
  payload: LedgerEvent['payload'] & {
    action: 'rotate' | 'retire' | 'activate';
    resourceType: 'signing_key';
    data: {
      oldKid?: string;
      newKid: string;
      algorithm: string;
      scope: 'factory' | 'tower' | 'federation';
      rotationReason: 'scheduled' | 'emergency' | 'compromise';
    };
  };
}

/**
 * Governance decision event - for audit trail
 */
export interface GovernanceDecisionEvent extends LedgerEvent {
  eventType: 'governance.decision';
  payload: LedgerEvent['payload'] & {
    action: 'approve' | 'reject' | 'waive' | 'escalate';
    resourceType: 'governance_gate';
    data: {
      gateId: string;
      decision: 'pass' | 'fail' | 'waived';
      evidence: Record<string, unknown>;
      reviewedBy?: string;
      comments?: string;
    };
  };
}

// ============================================================================
// Event Factory & Validation
// ============================================================================

/**
 * Create a new ledger event with required fields populated
 */
export function createLedgerEvent(
  params: Omit<LedgerEvent, 'eventId' | 'createdAt' | 'status' | 'driftHistory' | 'relations'> & {
    correlationId: string;
    parentEventId?: string;
  }
): LedgerEvent {
  const now = new Date().toISOString();

  return {
    eventId: generateEventId(),
    eventVersion: '1.0.0',
    createdAt: now,
    status: 'pending',
    driftHistory: [],
    relations: {
      correlationId: params.correlationId,
      parentEventId: params.parentEventId,
    },
    ...params,
  };
}

/**
 * Generate a UUIDv7-style event ID for time-ordered events
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

/**
 * Validate event atomicity - all required fields present
 */
export function validateEventAtomicity(event: LedgerEvent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!event.eventId) errors.push('Missing eventId');
  if (!event.eventType) errors.push('Missing eventType');
  if (!event.createdAt) errors.push('Missing createdAt');
  if (!event.actor?.actorId) errors.push('Missing actor.actorId');
  if (!event.tenant?.tenantId) errors.push('Missing tenant.tenantId');
  if (!event.payload?.action) errors.push('Missing payload.action');
  if (!event.payload?.resourceType) errors.push('Missing payload.resourceType');
  if (!event.payload?.resourceId) errors.push('Missing payload.resourceId');
  if (!event.idempotency?.idempotencyKey) errors.push('Missing idempotency.idempotencyKey');
  if (!event.relations?.correlationId) errors.push('Missing relations.correlationId');

  return { valid: errors.length === 0, errors };
}

/**
 * Validate governance gate binding
 */
export function validateGovernanceBinding(event: LedgerEvent): {
  valid: boolean;
  errors: string[];
  unboundGates: string[];
} {
  const errors: string[] = [];
  const unboundGates: string[] = [];

  if (!event.governanceGates || event.governanceGates.length === 0) {
    errors.push('No governance gates bound to event');
    return { valid: false, errors, unboundGates };
  }

  for (const gate of event.governanceGates) {
    if (!gate.gateId) errors.push('Gate missing gateId');
    if (gate.status === 'pending') unboundGates.push(gate.gateId);
    if (gate.status === 'fail' && !event.status.includes('reject')) {
      errors.push(`Gate ${gate.gateId} failed but event not rejected`);
    }
  }

  return {
    valid: errors.length === 0 && unboundGates.length === 0,
    errors,
    unboundGates
  };
}

/**
 * Add drift record to event
 */
export function recordDrift(
  event: LedgerEvent,
  fieldPath: string,
  previousValue: unknown,
  newValue: unknown,
  actor: string,
  reason?: string
): LedgerEvent {
  return {
    ...event,
    driftHistory: [
      ...event.driftHistory,
      {
        fieldPath,
        previousValue,
        newValue,
        changedAt: new Date().toISOString(),
        changedBy: actor,
        changeReason: reason,
      },
    ],
  };
}

// ============================================================================
// Commit Flow Types
// ============================================================================

/**
 * Commit sequence result
 */
export interface CommitResult {
  success: boolean;
  event: LedgerEvent;
  errors: string[];
  warnings: string[];
  governancePassed: boolean;
  sealValid: boolean;
  committedAt?: string;
}

/**
 * Commit options
 */
export interface CommitOptions {
  skipGovernance?: boolean;     // For emergency bypasses (requires waiver)
  dryRun?: boolean;             // Validate without committing
  requireSeal?: boolean;        // Require cryptographic seal
  emitProof?: boolean;          // Emit proof file on commit
  retryOnConflict?: boolean;    // Retry on idempotency conflict
}

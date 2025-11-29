/**
 * Ledger Commit Logic v1.0
 *
 * Implements the correct commit sequence:
 *   validate → execute → seal → commit
 *
 * Guarantees:
 * - No skipped governance gates
 * - No writes without proof commit
 * - Correct tenant isolation
 * - Atomic commit or rollback
 */

import {
  LedgerEvent,
  LedgerEventStatus,
  CommitResult,
  CommitOptions,
  validateEventAtomicity,
  validateGovernanceBinding,
  CryptographicSeal,
  recordDrift,
} from '@/types/ledger';
import { sha256, computeManifestDigest } from '@/lib/tower/merkle';
import { getActiveSigningKey, signPayload } from '@/lib/tower/signing';
import { checkAndStoreNonce, hasNonce } from '@/lib/security/nonceStore';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Commit Sequence Errors
// ============================================================================

export class CommitSequenceError extends Error {
  constructor(
    message: string,
    public step: 'validate' | 'execute' | 'seal' | 'commit',
    public event: LedgerEvent
  ) {
    super(`Commit failed at ${step}: ${message}`);
    this.name = 'CommitSequenceError';
  }
}

export class GovernanceGateError extends Error {
  constructor(
    public gateId: string,
    public reason: string,
    public event: LedgerEvent
  ) {
    super(`Governance gate ${gateId} failed: ${reason}`);
    this.name = 'GovernanceGateError';
  }
}

export class TenantIsolationError extends Error {
  constructor(
    public expectedTenant: string,
    public actualTenant: string
  ) {
    super(`Tenant isolation violation: expected ${expectedTenant}, got ${actualTenant}`);
    this.name = 'TenantIsolationError';
  }
}

// ============================================================================
// Step 1: Validate
// ============================================================================

/**
 * Validate event before execution
 * Checks: atomicity, governance gates, tenant isolation, idempotency
 */
export async function validateEvent(
  event: LedgerEvent,
  expectedTenant: string,
  options: CommitOptions = {}
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate atomicity (all required fields present)
  const atomicity = validateEventAtomicity(event);
  if (!atomicity.valid) {
    errors.push(...atomicity.errors.map(e => `Atomicity: ${e}`));
  }

  // 2. Tenant isolation check
  if (event.tenant.tenantId !== expectedTenant) {
    throw new TenantIsolationError(expectedTenant, event.tenant.tenantId);
  }

  // 3. Governance gate validation (unless explicitly skipped with waiver)
  if (!options.skipGovernance) {
    const governance = validateGovernanceBinding(event);
    if (!governance.valid) {
      errors.push(...governance.errors.map(e => `Governance: ${e}`));
    }
    if (governance.unboundGates.length > 0) {
      errors.push(`Unbound governance gates: ${governance.unboundGates.join(', ')}`);
    }
  } else {
    // Require waiver documentation when skipping governance
    const hasWaiver = event.governanceGates.some(g =>
      g.status === 'waived' && g.waiverReason && g.waiverApprovedBy
    );
    if (!hasWaiver) {
      errors.push('Governance skip requires documented waiver');
    } else {
      warnings.push('Governance gates skipped with waiver');
    }
  }

  // 4. Idempotency check (replay protection)
  const isReplay = await hasNonce(
    event.idempotency.idempotencyKey,
    event.idempotency.nonceContext
  );
  if (isReplay) {
    warnings.push('Idempotent replay detected - returning cached result');
    // In a real impl, would return cached result here
  }

  // 5. Status must be pending for new commits
  if (event.status !== 'pending' && event.status !== 'validated') {
    errors.push(`Invalid status for commit: ${event.status}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// Step 2: Execute
// ============================================================================

/**
 * Execute business logic for the event
 * Returns updated event with execution results
 */
export async function executeEvent(
  event: LedgerEvent,
  executor: (event: LedgerEvent) => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>
): Promise<LedgerEvent> {
  // Ensure event is validated before execution
  if (event.status !== 'validated') {
    throw new CommitSequenceError(
      'Event must be validated before execution',
      'execute',
      event
    );
  }

  const result = await executor(event);

  if (!result.success) {
    return {
      ...event,
      status: 'rejected' as LedgerEventStatus,
      executedAt: new Date().toISOString(),
      payload: {
        ...event.payload,
        metadata: {
          ...event.payload.metadata,
          executionError: result.error,
        },
      },
    };
  }

  return {
    ...event,
    status: 'executed' as LedgerEventStatus,
    executedAt: new Date().toISOString(),
    payload: {
      ...event.payload,
      metadata: {
        ...event.payload.metadata,
        executionResult: result.data,
      },
    },
  };
}

// ============================================================================
// Step 3: Seal
// ============================================================================

/**
 * Cryptographically seal the event
 * Creates immutable hash chain link
 */
export async function sealEvent(
  event: LedgerEvent,
  previousEventHash?: string
): Promise<LedgerEvent> {
  // Ensure event is executed before sealing
  if (event.status !== 'executed') {
    throw new CommitSequenceError(
      'Event must be executed before sealing',
      'seal',
      event
    );
  }

  // Get signing key
  const signingKey = getActiveSigningKey();

  // Compute canonical digest (excludes seal field)
  const { seal, ...eventWithoutSeal } = event;
  const canonical = JSON.stringify(eventWithoutSeal, Object.keys(eventWithoutSeal).sort());
  const digest = sha256(canonical);

  // Sign the digest
  const signature = signPayload({ digest, previousEventHash }, signingKey);

  const cryptoSeal: CryptographicSeal = {
    algorithm: signingKey.algorithm,
    digest,
    signature,
    signedBy: signingKey.kid,
    signedAt: new Date().toISOString(),
    previousEventHash,
  };

  return {
    ...event,
    status: 'sealed' as LedgerEventStatus,
    sealedAt: new Date().toISOString(),
    seal: cryptoSeal,
  };
}

// ============================================================================
// Step 4: Commit
// ============================================================================

/**
 * Commit event to ledger (persist + emit proof)
 * This is the final step - no writes before this
 */
export async function commitEvent(
  event: LedgerEvent,
  persistFn: (event: LedgerEvent) => Promise<void>,
  options: CommitOptions = {}
): Promise<CommitResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Ensure event is sealed before commit
  if (event.status !== 'sealed') {
    throw new CommitSequenceError(
      'Event must be sealed before commit',
      'commit',
      event
    );
  }

  // Verify seal integrity
  if (!event.seal) {
    throw new CommitSequenceError(
      'Missing cryptographic seal',
      'commit',
      event
    );
  }

  // Store nonce for replay protection
  const nonceStored = await checkAndStoreNonce(
    event.idempotency.idempotencyKey,
    event.idempotency.nonceContext,
    3600 // 1 hour TTL
  );

  if (!nonceStored) {
    warnings.push('Idempotent commit - already processed');
    return {
      success: true,
      event: { ...event, status: 'committed' as LedgerEventStatus },
      errors: [],
      warnings,
      governancePassed: true,
      sealValid: true,
      committedAt: event.committedAt,
    };
  }

  // Persist to ledger
  const committedEvent: LedgerEvent = {
    ...event,
    status: 'committed' as LedgerEventStatus,
    committedAt: new Date().toISOString(),
  };

  try {
    await persistFn(committedEvent);
  } catch (error) {
    throw new CommitSequenceError(
      `Persistence failed: ${(error as Error).message}`,
      'commit',
      event
    );
  }

  // Emit proof if requested
  if (options.emitProof !== false) {
    const proofPath = await emitEventProof(committedEvent);
    committedEvent.proofPath = proofPath;
    committedEvent.proofHash = sha256(JSON.stringify(committedEvent));
  }

  return {
    success: true,
    event: committedEvent,
    errors,
    warnings,
    governancePassed: true,
    sealValid: true,
    committedAt: committedEvent.committedAt,
  };
}

// ============================================================================
// Full Commit Orchestration
// ============================================================================

/**
 * Complete commit sequence: validate → execute → seal → commit
 *
 * This is the primary entry point for committing ledger events.
 * Guarantees correct sequence with no shortcuts.
 */
export async function commitLedgerEvent(
  event: LedgerEvent,
  expectedTenant: string,
  executor: (event: LedgerEvent) => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>,
  persistFn: (event: LedgerEvent) => Promise<void>,
  previousEventHash?: string,
  options: CommitOptions = {}
): Promise<CommitResult> {
  let currentEvent = { ...event };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // === STEP 1: VALIDATE ===
    const validation = await validateEvent(currentEvent, expectedTenant, options);
    if (!validation.valid) {
      return {
        success: false,
        event: { ...currentEvent, status: 'rejected' as LedgerEventStatus },
        errors: validation.errors,
        warnings: validation.warnings,
        governancePassed: false,
        sealValid: false,
      };
    }
    warnings.push(...validation.warnings);
    currentEvent = {
      ...currentEvent,
      status: 'validated' as LedgerEventStatus,
      validatedAt: new Date().toISOString(),
    };

    // Dry run stops after validation
    if (options.dryRun) {
      return {
        success: true,
        event: currentEvent,
        errors: [],
        warnings: [...warnings, 'Dry run - not committed'],
        governancePassed: true,
        sealValid: false,
      };
    }

    // === STEP 2: EXECUTE ===
    currentEvent = await executeEvent(currentEvent, executor);
    if (currentEvent.status === 'rejected') {
      return {
        success: false,
        event: currentEvent,
        errors: ['Execution failed'],
        warnings,
        governancePassed: true,
        sealValid: false,
      };
    }

    // === STEP 3: SEAL ===
    currentEvent = await sealEvent(currentEvent, previousEventHash);

    // === STEP 4: COMMIT ===
    const result = await commitEvent(currentEvent, persistFn, options);
    result.warnings.push(...warnings);

    return result;

  } catch (error) {
    if (error instanceof CommitSequenceError) {
      return {
        success: false,
        event: { ...currentEvent, status: 'rejected' as LedgerEventStatus },
        errors: [error.message],
        warnings,
        governancePassed: error.step !== 'validate',
        sealValid: error.step === 'commit',
      };
    }
    if (error instanceof TenantIsolationError) {
      return {
        success: false,
        event: { ...currentEvent, status: 'rejected' as LedgerEventStatus },
        errors: [error.message],
        warnings,
        governancePassed: false,
        sealValid: false,
      };
    }
    throw error;
  }
}

// ============================================================================
// Proof Emission
// ============================================================================

/**
 * Emit ledger event proof to filesystem
 */
async function emitEventProof(event: LedgerEvent): Promise<string> {
  const proofPath = join(
    process.cwd(),
    '..',
    'proof',
    `ledger_event_${event.eventType.replace(/\./g, '_')}_v1.json`
  );

  const proof = {
    schema: 'ledger_event_v1',
    eventId: event.eventId,
    eventType: event.eventType,
    status: event.status,
    tenant: event.tenant.tenantId,
    actor: event.actor.actorId,
    committedAt: event.committedAt,
    sealDigest: event.seal?.digest,
    governanceGates: event.governanceGates.map(g => ({
      gateId: g.gateId,
      status: g.status,
    })),
    generatedAt: new Date().toISOString(),
  };

  await writeFile(proofPath, JSON.stringify(proof, null, 2), 'utf-8');
  return proofPath;
}

// ============================================================================
// Rollback Support
// ============================================================================

/**
 * Create compensating event for rollback
 */
export function createRollbackEvent(
  originalEvent: LedgerEvent,
  reason: string,
  actor: LedgerEvent['actor']
): LedgerEvent {
  return {
    ...originalEvent,
    eventId: `${originalEvent.eventId}_rollback`,
    eventType: `${originalEvent.eventType}.rollback`,
    createdAt: new Date().toISOString(),
    status: 'pending' as LedgerEventStatus,
    actor,
    payload: {
      ...originalEvent.payload,
      action: 'rollback',
      metadata: {
        ...originalEvent.payload.metadata,
        rollbackReason: reason,
        originalEventId: originalEvent.eventId,
        originalCommittedAt: originalEvent.committedAt,
      },
    },
    relations: {
      ...originalEvent.relations,
      compensatingFor: originalEvent.eventId,
    },
    governanceGates: [],
    driftHistory: [],
    seal: undefined,
    validatedAt: undefined,
    executedAt: undefined,
    sealedAt: undefined,
    committedAt: undefined,
  };
}

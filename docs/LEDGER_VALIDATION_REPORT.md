# Ledger Validation Report

**Date:** 2025-11-29
**Branch:** `claude/validate-ledger-schema-01KheWFAER78H884iCxMUXCC`

---

## Executive Summary

This report validates the ledger event schema and commit logic in the qontrek-engine codebase. The analysis identified **critical gaps** in the existing implementation and provides a comprehensive solution.

### Key Findings

| Area | Status | Details |
|------|--------|---------|
| Ledger Event Schema | **MISSING** | No formal `ledger_event` schema existed |
| Commit Sequence | **PARTIAL** | Basic flow exists but lacks enforced sequencing |
| Governance Binding | **PARTIAL** | Gates defined but not bound to events |
| Actor Identity | **MISSING** | No actor tracking in events |
| Drift History | **MISSING** | No change tracking mechanism |
| Tenant Isolation | **GOOD** | RLS + brand context in place |

---

## Section 12: Ledger Event Schema Validation

### 12.1 Original State Analysis

**Existing event patterns found:**

1. **TowerReceipt** (`cockpit-ui/lib/tower/receipts.ts:5-23`)
   - Captures manifest hashes and signatures
   - Missing: actor identity, governance binding, drift history

2. **notify_events.json** (`proof/notify_events.json`)
   - Has `tenant_id` and `event_id`
   - Missing: actor, governance gates, seal

3. **ops_logs** (`sql/ops_log_insert.sql`)
   - Has brand isolation and metadata
   - Missing: cryptographic seal, governance binding

### 12.2 Atomicity Assessment

| Criterion | Before | After |
|-----------|--------|-------|
| Single source of truth | Partial | Yes |
| All-or-nothing commit | No | Yes |
| Immutable once committed | No | Yes |
| Self-describing payload | Partial | Yes |

**Issues Found:**
- Events scattered across multiple formats (receipts, logs, proofs)
- No unified event envelope
- Missing version fields for schema evolution

**Resolution:** Created `LedgerEvent` interface with:
```typescript
interface LedgerEvent {
  eventId: string;           // Globally unique
  eventType: string;         // Domain event type
  eventVersion: string;      // Schema version
  status: LedgerEventStatus; // Lifecycle state
  // ... atomic payload structure
}
```

### 12.3 Actor Identity Assessment

| Criterion | Before | After |
|-----------|--------|-------|
| Actor ID captured | No | Yes |
| Actor type classified | No | Yes |
| Auth method recorded | No | Yes |
| Session context linked | No | Yes |

**Issues Found:**
- No actor tracking in existing events
- Cannot audit who performed actions
- No differentiation between user/service/system actors

**Resolution:** Created `ActorIdentity` interface:
```typescript
interface ActorIdentity {
  actorId: string;
  actorType: 'user' | 'service' | 'system' | 'ci' | 'external';
  authMethod: 'jwt' | 'api_key' | 'mTLS' | 'service_token' | 'system';
  sessionId?: string;
  // ...
}
```

### 12.4 Governance Gate Binding Assessment

| Criterion | Before | After |
|-----------|--------|-------|
| Gates defined | Yes | Yes |
| Gates bound to events | No | Yes |
| Gate evidence recorded | Partial | Yes |
| Waiver tracking | No | Yes |

**Issues Found:**
- Governance gates (G13-G21) exist in `app/api/mcp/governance/route.ts`
- Gates not bound to individual events
- No tracking of which gates approved which events

**Resolution:** Created `GovernanceGateRef` interface:
```typescript
interface GovernanceGateRef {
  gateId: string;              // e.g., "G19"
  gateName: string;
  requiredEvidence: string[];
  passedAt?: string;
  status: 'pending' | 'pass' | 'fail' | 'waived';
  waiverReason?: string;
  waiverApprovedBy?: string;
}
```

### 12.5 Drift History Assessment

| Criterion | Before | After |
|-----------|--------|-------|
| Field-level changes tracked | No | Yes |
| Previous values captured | No | Yes |
| Change actor recorded | No | Yes |
| Change reason documented | No | Yes |

**Issues Found:**
- No mechanism to track how events/resources changed over time
- Audit trail incomplete for compliance

**Resolution:** Created `DriftRecord` interface:
```typescript
interface DriftRecord {
  fieldPath: string;
  previousValue: unknown;
  newValue: unknown;
  changedAt: string;
  changedBy: string;
  changeReason?: string;
}
```

### 12.6 Recommended Schema Improvements

| Improvement | Priority | Implemented |
|-------------|----------|-------------|
| Unified event envelope | Critical | Yes |
| Actor identity tracking | Critical | Yes |
| Governance gate binding | Critical | Yes |
| Drift history array | High | Yes |
| Cryptographic seal | High | Yes |
| Idempotency context | High | Yes |
| Event relations (saga support) | Medium | Yes |
| Tenant context | Medium | Yes |

---

## Section 13: Ledger Commit Logic Validation

### 13.1 Commit Sequence Analysis

**Expected Sequence:** `validate → execute → seal → commit`

**Existing Implementation (`uploadProof/route.ts:36-135`):**

| Step | Present | Enforced | Notes |
|------|---------|----------|-------|
| Validate manifest | Yes | Yes | Lines 42-61 |
| Execute (Merkle verify) | Yes | Yes | Lines 67-79 |
| Seal (co-sign) | Yes | Partial | Lines 87-92 |
| Commit (persist) | Yes | No | Lines 115-118 |

**Issues Found:**
1. Sequence not strictly enforced - steps can be skipped
2. No state machine ensuring progression
3. Missing rollback on partial failure

**Resolution:** Created `commitLedgerEvent()` with enforced sequence:
```typescript
export async function commitLedgerEvent(
  event: LedgerEvent,
  expectedTenant: string,
  executor: Function,
  persistFn: Function,
  previousEventHash?: string,
  options: CommitOptions = {}
): Promise<CommitResult> {
  // STEP 1: VALIDATE (required)
  // STEP 2: EXECUTE (required, must be validated)
  // STEP 3: SEAL (required, must be executed)
  // STEP 4: COMMIT (required, must be sealed)
}
```

### 13.2 Governance Gate Skipping Analysis

**Current State:**
- Gates checked in `governance/route.ts` but not enforced on commits
- No mechanism to prevent commits bypassing gates

**Issues Found:**
1. `uploadProof` does not verify governance gates passed
2. No gate status verification before commit
3. Missing audit trail for skipped gates

**Resolution:** Added governance validation in commit flow:
```typescript
// In validateEvent()
if (!options.skipGovernance) {
  const governance = validateGovernanceBinding(event);
  if (!governance.valid) {
    errors.push(...governance.errors);
  }
} else {
  // Require waiver documentation
  const hasWaiver = event.governanceGates.some(g =>
    g.status === 'waived' && g.waiverReason && g.waiverApprovedBy
  );
  if (!hasWaiver) {
    errors.push('Governance skip requires documented waiver');
  }
}
```

### 13.3 Proof Commit Analysis

**Current State:**
- Proof files emitted after receipt storage (`emitTowerReceiptProof`)
- No guarantee of atomic proof + data commit

**Issues Found:**
1. Data can be written without corresponding proof
2. Proof emission is separate function, not part of transaction
3. Missing proof hash in committed event

**Resolution:** Integrated proof emission into commit:
```typescript
// In commitEvent()
if (options.emitProof !== false) {
  const proofPath = await emitEventProof(committedEvent);
  committedEvent.proofPath = proofPath;
  committedEvent.proofHash = sha256(JSON.stringify(committedEvent));
}
```

### 13.4 Tenant Isolation Analysis

**Current State:**
- Good RLS implementation in Supabase tests
- Brand context set via `set_config('app.brand', ...)` in SQL

**Strengths:**
1. RLS policies active for brand filtering
2. Brand auto-tagged on inserts
3. Context isolation per transaction

**Issues Found:**
1. Commit logic doesn't verify tenant matches context
2. Cross-tenant writes theoretically possible

**Resolution:** Added tenant verification in validate step:
```typescript
if (event.tenant.tenantId !== expectedTenant) {
  throw new TenantIsolationError(expectedTenant, event.tenant.tenantId);
}
```

---

## Files Created

| File | Purpose |
|------|---------|
| `cockpit-ui/types/ledger.ts` | Comprehensive ledger event schema |
| `cockpit-ui/lib/ledger/commit.ts` | Enforced commit sequence logic |
| `docs/LEDGER_VALIDATION_REPORT.md` | This validation report |

---

## Recommendations

### Immediate Actions

1. **Migrate existing events to LedgerEvent schema**
   - Update TowerReceipt to extend LedgerEvent
   - Add governance binding to proof uploads

2. **Integrate commit logic into API routes**
   - Replace direct persistence with `commitLedgerEvent()`
   - Ensure all writes go through commit flow

3. **Add database migration for ledger_events table**
   - Create SQL schema matching TypeScript types
   - Add indexes for eventId, tenantId, createdAt

### Future Enhancements

1. **Event sourcing integration**
   - Consider event store (EventStoreDB, Kafka)
   - Enable replay and projection

2. **Merkle tree batching**
   - Batch events for efficiency
   - Include batch merkle root in seals

3. **External attestation**
   - Sigstore/COSIGN integration
   - Timestamping authority

---

## Appendix: Schema Quick Reference

### Core LedgerEvent Fields

```typescript
{
  // Identity
  eventId: "evt_1234_abc",
  eventType: "federation.batch_sync",
  eventVersion: "1.0.0",

  // Timestamps
  createdAt: "2025-11-29T00:00:00Z",
  validatedAt: "...",
  executedAt: "...",
  sealedAt: "...",
  committedAt: "...",

  // Status
  status: "committed",

  // Actor (WHO)
  actor: {
    actorId: "user_123",
    actorType: "user",
    authMethod: "jwt"
  },

  // Tenant (WHERE)
  tenant: {
    tenantId: "voltek",
    environment: "production"
  },

  // Governance (WHY allowed)
  governanceGates: [{
    gateId: "G19",
    status: "pass"
  }],

  // Payload (WHAT)
  payload: {
    action: "sync",
    resourceType: "batch",
    resourceId: "batch_456",
    data: { ... }
  },

  // Relationships
  relations: {
    correlationId: "corr_789"
  },

  // Drift History (HOW changed)
  driftHistory: [],

  // Idempotency
  idempotency: {
    idempotencyKey: "idem_abc",
    nonce: "nonce_xyz"
  },

  // Seal
  seal: {
    algorithm: "HMAC-SHA256",
    digest: "...",
    signature: "..."
  }
}
```

---

*Report generated as part of ledger validation task on branch `claude/validate-ledger-schema-01KheWFAER78H884iCxMUXCC`*

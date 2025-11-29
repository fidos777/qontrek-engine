# MCP Tool Safety Validation Report

**Generated:** 2025-11-29
**Validator:** Claude Code (Opus 4)
**Scope:** Qontrek Engine MCP Tools & Governance Compliance

---

## Executive Summary

This report validates MCP tools in the Qontrek Engine against:
1. Governance enforcement before execution
2. Actor identity validation
3. Direct DB writes without ledger events
4. Standard MCP manifest pattern compliance
5. Tool Execution Sandbox (TES) conformance
6. Input/output schema contracts
7. Vertical archetype bounding rules

**Overall Assessment:** ⚠️ PARTIAL COMPLIANCE - Corrections Required

---

## 1. Governance Enforcement Before Execution

### Current State

| Tool | Pre-Check | Rating |
|------|-----------|--------|
| `/api/mcp/governance` | ❌ None | FAIL |
| `/api/mcp/healthz` | ❌ None | FAIL |
| `/api/mcp/tail` | ⚠️ Rate limiting only | PARTIAL |
| `/api/tower/uploadProof` | ⚠️ Input validation only | PARTIAL |
| `/api/tower/verifyDigest` | ⚠️ Input validation only | PARTIAL |
| `/api/tower/ack/[receipt_id]` | ❌ None | FAIL |

### Violations Found

**VIOLATION 1:** `cockpit-ui/app/api/mcp/governance/route.ts:11`
```typescript
export async function GET() {
  // ❌ No governance pre-check before execution
  try {
    const proofDir = join(process.cwd(), '..', 'proof');
```

**VIOLATION 2:** `cockpit-ui/app/api/mcp/healthz/route.ts:20`
```typescript
export async function GET() {
  // ❌ No authorization or governance validation
  try {
    const receipts = await listReceipts(100);
```

**VIOLATION 3:** `cockpit-ui/app/api/tower/ack/[receipt_id]/route.ts:44-50`
```typescript
// ❌ Auto-verification without governance approval
if (receipt.status === 'received') {
  receipt.status = 'verified';
  receipt.verifiedAt = new Date().toISOString();
  await storeReceipt(receipt);  // State mutation without governance gate
}
```

### Required Corrections

See `lib/governance/middleware.ts` for the governance enforcement middleware. All routes must call:

```typescript
const governance = await enforceGovernance(request, TOOL_NAME, {
  requireAuth: true,
  requireNonce: true,
  requireSignature: false,
  allowedActorTypes: ['user', 'service', 'system', 'federation'],
  allowedScopes: ['read', 'admin'],
});

if (!governance.allowed) {
  return createGovernanceErrorResponse(governance.error!, requestId);
}
```

---

## 2. Actor Identity Validation

### Current State

| Tool | Identity Check | Rating |
|------|----------------|--------|
| All MCP tools | ❌ None | FAIL |

### Violations Found

**VIOLATION:** All MCP tools lack actor identity validation

- No JWT/session token validation
- No API key validation
- No request signing verification
- No nonce validation for requests

### Required Corrections

Actor identity must be extracted and validated:

```typescript
// Required headers for actor identity:
// - Authorization: Bearer <JWT>
// - x-api-key: <API_KEY>
// - x-actor-id: <ACTOR_ID>
// - x-nonce: <UNIQUE_NONCE>
// - x-timestamp: <UNIX_MS>
// - x-signature: <HMAC_SIGNATURE>

const actor = extractActorIdentity(request);
if (!actor) {
  return { status: 401, message: 'Unauthorized' };
}
```

---

## 3. Direct DB Writes Without Ledger Events

### Current State

| Component | Ledger Event | Rating |
|-----------|--------------|--------|
| `nonceStore.ts` | ❌ Direct SQLite | FAIL |
| `receipts.ts` | ❌ Direct file write | FAIL |
| `keyRegistry.ts` | ❌ Direct file write | FAIL |
| `tower/ack` | ❌ Status update without audit | FAIL |

### Violations Found

**VIOLATION 1:** `lib/security/nonceStore.ts:74-77`
```typescript
// ❌ Direct SQLite write without ledger event
await db.run(
  'INSERT OR REPLACE INTO nonces (nonce, context, created_at, expires_at) VALUES (?, ?, ?, ?)',
  [nonce, context, now, expiresAt]
);
```

**VIOLATION 2:** `lib/tower/receipts.ts:46`
```typescript
// ❌ File write without ledger event
await writeFile(receiptPath, JSON.stringify(receipt, null, 2), 'utf-8');
```

**VIOLATION 3:** `lib/security/keyRegistry.ts:64`
```typescript
// ❌ Registry update without ledger event
await writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
```

### Required Corrections

All state mutations must emit ledger events:

```typescript
import { emitStateMutation } from '@/lib/governance/ledger';

// Before any state change:
await emitStateMutation({
  actorId: context.actor.actorId,
  actorType: context.actor.actorType,
  resource: 'tower_receipt',
  resourceId: receiptId,
  operation: 'create',
  previousState: undefined,
  newState: receipt,
  toolName: TOOL_NAME,
});

// Then perform the actual write
await storeReceipt(receipt);
```

---

## 4. Standard MCP Manifest Pattern Compliance

### Current State

| Aspect | Status | Rating |
|--------|--------|--------|
| Input validation | ⚠️ Partial (manual) | PARTIAL |
| Output validation | ❌ None | FAIL |
| Schema versioning | ⚠️ In types only | PARTIAL |
| Manifest declaration | ❌ Missing | FAIL |

### Required Corrections

1. Use Zod schemas for runtime validation (see `lib/governance/schemas.ts`)
2. All responses must use the standard envelope:

```typescript
interface MCPResponseEnvelope<T> {
  ok: boolean;
  requestId: string;
  timestamp: string;
  schemaVersion: string;
  data: T;
  governance?: {
    actorId: string;
    checks: Array<{ check: string; passed: boolean; message?: string }>;
  };
}
```

3. Create MCP manifest file documenting all tools:

```yaml
# mcp_manifest.yaml
version: "1.0.0"
tools:
  - name: "/api/mcp/governance"
    method: GET
    description: "Returns governance KPI snapshot for G13-G21 gates"
    authentication: required
    scopes: [read, admin]
    verticals: [federation, executive]
    inputSchema: null
    outputSchema: GovernanceResponseSchema
```

---

## 5. Tool Execution Sandbox (TES) Conformance

### Current State

| Aspect | Status | Rating |
|--------|--------|--------|
| Rate limiting | ✅ Implemented (tail) | PASS |
| PII scrubbing | ✅ Implemented | PASS |
| Memory limits | ❌ Not enforced | FAIL |
| CPU time limits | ❌ Not enforced | FAIL |
| I/O sandboxing | ❌ Not enforced | FAIL |
| Resource quotas | ❌ Not enforced | FAIL |

### Existing Implementations

**Rate Limiting:** `app/api/mcp/tail/route.ts:15-19`
```typescript
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  maxLines: 1000,
};
```

**PII Scrubbing:** `lib/security/scrubber.ts`
- Covers: email, phone, credit card, SSN, NRIC, UUID, AWS ARN, API keys, JWT, IPv4, GitHub tokens

### Required Corrections

1. Apply rate limiting to ALL MCP tools (not just tail)
2. Implement execution timeouts:

```typescript
const EXECUTION_LIMITS = {
  maxExecutionMs: 30000,      // 30 second timeout
  maxMemoryMb: 256,           // 256 MB limit
  maxOutputBytes: 1024 * 1024, // 1 MB output limit
};
```

---

## 6. Input/Output Schema Contracts

### Current State

| Aspect | Status | Rating |
|--------|--------|--------|
| Type definitions | ✅ Exist | PASS |
| Runtime validation | ❌ Not implemented | FAIL |
| Schema versioning | ⚠️ Partial | PARTIAL |
| Contract testing | ❌ Not found | FAIL |

### Existing Type Contracts

**Frozen types:** `types/gates.ts`
```typescript
// ⚠️ FROZEN - DO NOT MODIFY
// Changes must be approved by Commander (GPT-5).

export interface BaseEnvelope<T> {
  ok: boolean;
  rel: string;
  source: SourceFlag;
  path?: string;
  schemaVersion: string;
  data: T;
}
```

### Required Corrections

1. Add Zod runtime validation (see `lib/governance/schemas.ts`)
2. Validate all inputs before processing:

```typescript
const validation = UploadProofRequestSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({
    error: 'Invalid request body',
    details: validation.error.flatten(),
  }, { status: 400 });
}
```

3. Validate outputs before returning (for observability):

```typescript
const outputValidation = ResponseSchema.safeParse(responseData);
if (!outputValidation.success) {
  console.error('Output schema violation:', outputValidation.error);
  // Trigger alert but still return response
}
```

---

## 7. Vertical Archetype Bounding Rules

### Current State

| Aspect | Status | Rating |
|--------|--------|--------|
| Persona matrix | ⚠️ Minimal (2 rules) | PARTIAL |
| Tool-to-vertical mapping | ❌ Not enforced | FAIL |
| Gate-based boundaries | ⚠️ Implicit only | PARTIAL |

### Existing Configuration

**Persona Matrix:** `config/persona_matrix.yaml`
```yaml
rules:
- confidence: 0.95
  if: vertical == "clinic" and title contains "reminder"
  persona: Zeyti
- confidence: 0.9
  if: title contains "quotation" or "roi"
  persona: Danish
```

### Required Corrections

1. Implement tool-to-vertical mapping (see `lib/governance/schemas.ts`):

```typescript
export const TOOL_VERTICAL_MAP: Record<string, VerticalArchetype[]> = {
  '/api/mcp/governance': ['federation', 'executive'],
  '/api/mcp/healthz': ['federation', 'executive', 'operations'],
  '/api/mcp/tail': ['operations', 'federation'],
  '/api/tower/uploadProof': ['federation'],
  '/api/tower/verifyDigest': ['federation'],
  '/api/tower/ack': ['federation'],
  '/api/gates/g0': ['sales'],
  '/api/gates/g1': ['sales'],
  '/api/gates/g2': ['finance', 'sales'],
  '/api/cfo': ['executive', 'finance'],
  '/api/docs': ['operations'],
};
```

2. Enforce vertical checks in all tools:

```typescript
const actorVertical = request.headers.get('x-vertical') as VerticalArchetype;
if (!isVerticalAllowed(TOOL_NAME, actorVertical)) {
  return NextResponse.json({
    error: 'Vertical archetype not permitted',
    allowedVerticals: TOOL_VERTICAL_MAP[TOOL_NAME],
  }, { status: 403 });
}
```

---

## Summary of Corrections Made

### New Files Created

| File | Purpose |
|------|---------|
| `lib/governance/middleware.ts` | Governance enforcement middleware |
| `lib/governance/schemas.ts` | Zod schemas for input/output validation |
| `lib/governance/ledger.ts` | Durable ledger event store |
| `lib/governance/index.ts` | Centralized exports |
| `app/api/mcp/governance/route.corrected.ts` | Corrected governance API |
| `app/api/tower/uploadProof/route.corrected.ts` | Corrected upload proof API |

### Implementation Steps

1. **Install Zod dependency:**
   ```bash
   cd cockpit-ui && npm install zod
   ```

2. **Rename corrected files to replace originals:**
   ```bash
   mv app/api/mcp/governance/route.corrected.ts app/api/mcp/governance/route.ts
   mv app/api/tower/uploadProof/route.corrected.ts app/api/tower/uploadProof/route.ts
   ```

3. **Apply same pattern to remaining tools:**
   - `/api/mcp/healthz/route.ts`
   - `/api/mcp/tail/route.ts`
   - `/api/tower/verifyDigest/route.ts`
   - `/api/tower/ack/[receipt_id]/route.ts`

4. **Update existing stores to emit ledger events:**
   - `lib/security/nonceStore.ts`
   - `lib/tower/receipts.ts`
   - `lib/security/keyRegistry.ts`

5. **Create MCP manifest file:**
   - Document all tools with schemas
   - Include capability declarations
   - Specify rate limits per tool

---

## Compliance Checklist

| # | Requirement | Status | Action |
|---|-------------|--------|--------|
| 1 | Governance enforcement before execution | ❌ | Apply middleware to all routes |
| 2 | Actor identity validation | ❌ | Extract and validate from headers |
| 3 | No direct DB writes without ledger | ❌ | Emit state mutation events |
| 4 | Standard MCP manifest pattern | ⚠️ | Add manifest file, use envelope |
| 5 | TES conformance | ⚠️ | Add timeouts, extend rate limits |
| 6 | Input/output schema contracts | ⚠️ | Add runtime Zod validation |
| 7 | Vertical archetype bounding | ❌ | Implement tool-vertical mapping |

---

## References

- `lib/governance/middleware.ts` - Governance middleware implementation
- `lib/governance/schemas.ts` - Schema contracts
- `lib/governance/ledger.ts` - Ledger event store
- `types/gates.ts` - Frozen type contracts
- `manifest_operational_ui_v19.yaml` - Operational manifest

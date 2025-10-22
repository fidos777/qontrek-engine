# Federation Sync Protocol v1.0

**Version**: 1.0
**Status**: Active
**Last Updated**: 2025-01-22
**Release**: G19.9.2-R1.4.5

## Abstract

This document defines the Federation Sync Protocol for exchanging cryptographically signed acknowledgment (ACK) logs between Atlas Factory Runtime nodes (Voltek) and Tower nodes. The protocol ensures:
- **Authenticity**: HMAC-SHA256 signatures on all ACKs
- **Idempotency**: Duplicate detection via batch_id + event_id
- **Anti-replay**: Durable nonce store with TTL
- **Clock discipline**: Skew measurement and governance reporting
- **Backpressure**: Pagination and payload size limits

## Motivation

Factory Runtime nodes must exchange proof-of-work ACKs with Tower nodes to establish:
1. **Bidirectional trust**: Both parties verify each other's signatures
2. **Lineage continuity**: ACK chains prove historical operations
3. **Distributed consensus**: Multiple nodes agree on system state
4. **Audit trail**: Immutable record of inter-node communication

Without a versioned, resilient protocol:
- **Protocol drift**: Nodes diverge on message format
- **Replay attacks**: Old ACKs re-sent to exhaust resources
- **Clock skew**: Timestamp disagreements break verification
- **Resource exhaustion**: Unbounded batch sizes cause OOM

## Protocol Overview

```
┌────────────┐         POST /federation/sync         ┌────────────┐
│   Voltek   │ ─────────────────────────────────────> │   Tower    │
│  (Atlas)   │   Request: {batch_id, items[], ...}    │   (C5)     │
│            │                                         │            │
│            │ <───────────────────────────────────── │            │
│            │   Response: {received, skipped, ...}   │            │
└────────────┘                                         └────────────┘

┌────────────┐         POST /federation/sync         ┌────────────┐
│   Tower    │ ─────────────────────────────────────> │   Voltek   │
│   (C5)     │   Request: {batch_id, items[], ...}    │  (Atlas)   │
│            │                                         │            │
│            │ <───────────────────────────────────── │            │
│            │   Response: {received, skipped, ...}   │            │
└────────────┘                                         └────────────┘
```

**Symmetric Protocol**: Both nodes implement identical endpoint (bidirectional sync).

## Authentication

### Shared Key

**Environment Variable**: `FEDERATION_KEY`
- **Length**: 256 bits (32 bytes, 64 hex chars)
- **Rotation**: Quarterly (90 days)
- **Storage**: Environment variable only (never commit)

**Example**:
```bash
FEDERATION_KEY=a1b2c3d4e5f6789012345678901234567890abcdefabcdefabcdefabcdefabcd
```

### Request Authentication

**Header**: `X-Federation-Key`
```http
POST /api/mcp/federation/sync HTTP/1.1
Host: tower.qontrek.com
Content-Type: application/json
X-Federation-Key: a1b2c3d4e5f6789012345678901234567890abcdefabcdefabcdefabcdefabcd
```

**Verification**:
```typescript
const providedKey = req.headers.get("x-federation-key");
const expectedKey = process.env.FEDERATION_KEY;

if (providedKey !== expectedKey) {
  return NextResponse.json(
    { error: "unauthorized", message: "Invalid federation key" },
    { status: 401 }
  );
}
```

**Security**: Use constant-time comparison to prevent timing attacks.

## Request Format

### JSON Schema

```json
{
  "protocol_version": "1.0",
  "batch_id": "batch-<uuid>",
  "node_id": "atlas-voltek-01",
  "node_type": "atlas" | "tower",
  "since": 1737567890123,
  "window_ms": 300000,
  "items": [
    {
      "event_id": "ack-<uuid>",
      "event_type": "tower.ack",
      "timestamp": 1737567890123,
      "nonce": "<uuid>",
      "payload": {
        "proof_id": "security_seal_v1",
        "merkle_root": "abc123...",
        "status": "verified"
      },
      "signature": "<hmac-sha256>",
      "prev_signature": "<hmac-sha256>"
    }
  ],
  "cursor": null | "opaque-cursor-string"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol_version` | string | ✓ | Protocol version (e.g., "1.0") |
| `batch_id` | string | ✓ | Idempotency key for batch (format: `batch-<uuid>`) |
| `node_id` | string | ✓ | Sending node identifier |
| `node_type` | enum | ✓ | Node type: "atlas" or "tower" |
| `since` | number | ✗ | Filter: events after this timestamp (ms) |
| `window_ms` | number | ✗ | Filter: time window duration (ms) |
| `items` | array | ✓ | Array of ACK items (max 100 per batch) |
| `cursor` | string\|null | ✗ | Pagination cursor (opaque) |

### Item Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | string | ✓ | Unique event identifier (format: `ack-<uuid>`) |
| `event_type` | string | ✓ | Event type (e.g., "tower.ack") |
| `timestamp` | number | ✓ | Unix timestamp in milliseconds |
| `nonce` | string | ✓ | UUID for replay prevention |
| `payload` | object | ✓ | Event-specific data |
| `signature` | string | ✓ | HMAC-SHA256 signature of canonical event |
| `prev_signature` | string | ✗ | Previous event signature (chain continuity) |

### Constraints

- **Batch size**: Maximum 100 items per request
- **Payload size**: Maximum 5 MB per request
- **Item size**: Maximum 50 KB per item
- **Timestamp freshness**: Within ±5 minutes of server time
- **Nonce uniqueness**: Must not have been seen before

## Response Format

### Success Response (200 OK)

```json
{
  "status": "ok",
  "batch_id": "batch-<uuid>",
  "received": 95,
  "skipped": 5,
  "errors": 0,
  "clock_skew_ms": -120,
  "next_cursor": "opaque-cursor" | null,
  "details": [
    {
      "event_id": "ack-123",
      "status": "received",
      "reason": null
    },
    {
      "event_id": "ack-456",
      "status": "skipped",
      "reason": "duplicate"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | "ok", "partial", or "error" |
| `batch_id` | string | Echo of request batch_id |
| `received` | number | Count of successfully received items |
| `skipped` | number | Count of skipped items (duplicates) |
| `errors` | number | Count of errored items (invalid signature, etc.) |
| `clock_skew_ms` | number | Server's view of clock skew (request timestamp - server time) |
| `next_cursor` | string\|null | Cursor for next page (if paginated) |
| `details` | array | Per-item status details |

### Error Responses

**401 Unauthorized** (Invalid federation key):
```json
{
  "error": "unauthorized",
  "message": "Invalid federation key"
}
```

**413 Payload Too Large** (Batch > 5 MB):
```json
{
  "error": "payload_too_large",
  "message": "Request payload exceeds 5 MB limit",
  "max_size_mb": 5,
  "actual_size_mb": 7.3
}
```

**429 Too Many Requests** (Rate limit exceeded):
```json
{
  "error": "rate_limit_exceeded",
  "message": "Federation sync rate limit exceeded",
  "limit": 10,
  "window_seconds": 60,
  "retry_after": 45
}
```

**503 Service Unavailable** (Panic mode):
```json
{
  "error": "panic_mode_active",
  "message": "Federation disabled due to panic mode"
}
```

## Clock Discipline

### Clock Skew Measurement

**Request Header**: `X-Request-Timestamp`
```http
X-Request-Timestamp: 1737567890123
```

**Response Header**: `X-Clock-Skew-Ms`
```http
X-Clock-Skew-Ms: -120
```

**Calculation**:
```typescript
const requestTimestamp = Number(req.headers.get("x-request-timestamp"));
const serverTimestamp = Date.now();
const clockSkewMs = requestTimestamp - serverTimestamp;

// Add to response headers
res.headers.set("X-Clock-Skew-Ms", String(clockSkewMs));
```

**Interpretation**:
- **Positive skew**: Request timestamp ahead of server (client clock fast)
- **Negative skew**: Request timestamp behind server (client clock slow)

### Skew Thresholds

| Skew | Status | Action |
|------|--------|--------|
| < 30s | ok | Accept request |
| 30s - 90s | warn | Accept with warning, log for governance |
| > 90s | fail | Reject request with 400 Bad Request |

### Governance Metrics

Track skew statistics over 24 hours:
- **p50_skew_ms**: Median skew
- **p95_skew_ms**: 95th percentile skew
- **max_skew_ms**: Maximum absolute skew
- **sample_count**: Number of measurements

**Storage**: `.logs/mcp/federation_health.json`

## Idempotency

### Batch-Level Idempotency

**Idempotency Key**: `batch_id`
- Format: `batch-<uuid>` (e.g., `batch-550e8400-e29b-41d4-a716-446655440000`)
- Uniqueness: Per sending node
- Retention: 24 hours in batch cache

**Behavior**:
1. First request with `batch_id`: Process all items
2. Duplicate request with same `batch_id`: Return cached response (no processing)

**Cache Storage**: In-memory Map or Redis
```typescript
const batchCache = new Map<string, CachedResponse>();

if (batchCache.has(batch_id)) {
  return batchCache.get(batch_id);
}
```

### Item-Level Idempotency

**Idempotency Key**: `event_id`
- Format: `ack-<uuid>` (e.g., `ack-123e4567-e89b-12d3-a456-426614174000`)
- Uniqueness: Global across all batches
- Retention: Permanent (SQLite primary key)

**Behavior**:
1. Item with new `event_id`: Insert into ledger
2. Item with existing `event_id`: Skip (status: "skipped", reason: "duplicate")

**SQLite Schema**:
```sql
CREATE TABLE ack_ledger (
  event_id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  ...
);
```

## Anti-Replay Protection

### Nonce Validation

**Nonce Format**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**Validation Steps**:
1. Check nonce not seen before (query nonce store)
2. Record nonce with TTL (default 300 seconds)
3. Auto-prune expired nonces

**Nonce Store**: SQLite database (`.logs/nonces.db`) from R1.4.3

**Functions**:
```typescript
import { seen, record } from "@/lib/security/nonceStore";

if (seen(nonce)) {
  return { status: "error", reason: "nonce_replay" };
}

record(nonce, 300); // 5 minute TTL
```

### Replay Detection

**Duplicate Detection**:
1. **Batch-level**: Same `batch_id` → cached response
2. **Item-level**: Same `event_id` → skip item
3. **Nonce-level**: Same `nonce` → reject item

**Governance Metric**:
```typescript
replay_rate = (items_skipped_due_to_duplicate / total_items_processed) * 100
```

**Target**: `replay_rate < 1%` (should be near-zero in production)

## Backpressure Management

### Pagination

**Request Parameters**:
- `limit`: Maximum items per page (default 100, max 100)
- `cursor`: Opaque pagination cursor (base64-encoded offset)

**Example Request**:
```json
{
  "protocol_version": "1.0",
  "batch_id": "batch-page2",
  "node_id": "atlas-voltek-01",
  "items": [],
  "cursor": "eyJvZmZzZXQiOjEwMCwidG90YWwiOjUwMH0="
}
```

**Example Response with Next Cursor**:
```json
{
  "status": "ok",
  "received": 100,
  "next_cursor": "eyJvZmZzZXQiOjIwMCwidG90YWwiOjUwMH0="
}
```

**Cursor Format** (base64-encoded JSON):
```json
{
  "offset": 100,
  "total": 500,
  "since": 1737567890123
}
```

### Size Limits

| Limit | Value | Enforcement |
|-------|-------|-------------|
| Max items per batch | 100 | Return 400 if exceeded |
| Max request payload | 5 MB | Return 413 if exceeded |
| Max item payload | 50 KB | Return 400 for item |
| Max concurrent batches | 10 | Return 429 if exceeded |

### Rate Limiting

**Per-Node Limits**:
- **10 requests per minute** per node_id
- **100 items per minute** per node_id

**Implementation**:
```typescript
const rateLimits = new Map<string, TokenBucket>();

const bucket = rateLimits.get(node_id) || new TokenBucket(10, 60);
if (!bucket.consume()) {
  return NextResponse.json(
    { error: "rate_limit_exceeded", retry_after: bucket.resetIn() },
    { status: 429 }
  );
}
```

## Signature Verification

### Canonical Representation

**Same as `lib/security/signEvent.ts`**:
```typescript
const canonical = JSON.stringify({
  type: event_type,
  timestamp,
  payload,
  prev_signature,
  node_id,
  nonce,
}, Object.keys(...).sort());
```

### HMAC Computation

```typescript
import { createHmac } from "crypto";

const sharedKey = process.env.FEDERATION_KEY;
const hmac = createHmac("sha256", sharedKey);
hmac.update(canonical);
const signature = hmac.digest("hex");
```

### Verification

```typescript
import { verifyAck } from "@/lib/federation/signer";

const verification = verifyAck(item, {
  sharedKey: process.env.FEDERATION_KEY,
  maxAgeSec: 300,
});

if (!verification.valid) {
  return { status: "error", reason: verification.error };
}
```

## Ledger Storage

### SQLite Schema

```sql
CREATE TABLE ack_ledger (
  event_id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  nonce TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  prev_signature TEXT,
  created_at BIGINT NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Indexes
CREATE INDEX idx_ack_ledger_batch_id ON ack_ledger(batch_id);
CREATE INDEX idx_ack_ledger_node_id ON ack_ledger(node_id);
CREATE INDEX idx_ack_ledger_timestamp ON ack_ledger(timestamp);
CREATE INDEX idx_ack_ledger_created_at ON ack_ledger(created_at);
```

### JSONL Export

**Export Path**: `.logs/federation/ack_ledger.jsonl`

**Export Function**:
```typescript
export function exportLedgerToJSONL(): void {
  const db = initLedgerDB();
  const rows = db.prepare("SELECT * FROM ack_ledger ORDER BY timestamp").all();

  const jsonl = rows.map(row => JSON.stringify(row)).join("\n");
  fs.writeFileSync(JSONL_PATH, jsonl);
}
```

**Auto-export**: Triggered after each successful batch sync.

### Size Management

**SQLite Database**: No hard limit (auto-vacuumed)
**JSONL Export**: Maximum 5 MB (truncate oldest if exceeded)

**Rotation**:
```typescript
if (fs.statSync(JSONL_PATH).size > 5 * 1024 * 1024) {
  fs.renameSync(JSONL_PATH, `${JSONL_PATH}.bak`);
  exportLedgerToJSONL(); // Fresh export
}
```

## Governance Integration

### G18: Federation Status

**Gate**: `G18_FEDERATION_OK`

**Criteria**:
- ✅ Last ACK verified within 5 minutes
- ✅ Clock skew p95 < 60 seconds
- ✅ Replay rate < 1%
- ✅ No panic mode

**Response**:
```json
{
  "ok": true,
  "desc": "Federation Status",
  "status": "pass",
  "message": "ACK verified 45s ago, skew_p95=12ms, replay_rate=0.02%",
  "metrics": {
    "ack_verified": true,
    "ack_age_seconds": 45,
    "skew_p50_ms": 8,
    "skew_p95_ms": 12,
    "replay_rate_percent": 0.02,
    "total_acks_synced": 1250
  }
}
```

## Cold-Start Sync

### Scenario

Fresh node with empty ledger syncs from established Tower.

### Steps

1. **Initial Request** (since=0, no cursor):
```json
{
  "protocol_version": "1.0",
  "batch_id": "batch-coldstart-1",
  "node_id": "atlas-voltek-02",
  "since": 0,
  "items": []
}
```

2. **Tower Response** (paginated):
```json
{
  "status": "ok",
  "received": 0,
  "skipped": 0,
  "items_available": 500,
  "next_cursor": "eyJvZmZzZXQiOjAsInRvdGFsIjo1MDB9"
}
```

3. **Follow-up Requests** (with cursor):
```json
{
  "batch_id": "batch-coldstart-2",
  "cursor": "eyJvZmZzZXQiOjAsInRvdGFsIjo1MDB9",
  "items": []
}
```

4. **Tower Sends Batch**:
```json
{
  "batch_id": "batch-tower-export-1",
  "node_id": "tower-01",
  "items": [/* 100 ACKs */]
}
```

5. **Voltek Acknowledges** (returns received counts)

6. **Repeat** until `next_cursor = null`

### Consistency Guarantees

- **No duplicates**: `event_id` primary key prevents dupes
- **Ordering**: Items ordered by `timestamp` on export
- **Completeness**: Cursor ensures all items delivered

## Security Considerations

### S1: Key Rotation

**Rotation Schedule**: Quarterly (90 days)

**Procedure**:
1. Generate new 256-bit key
2. Update `FEDERATION_KEY` on both nodes
3. Test sync with new key
4. Revoke old key

**Overlap Period**: 24 hours (accept both old and new keys)

### S2: Replay Windows

**Nonce TTL**: 300 seconds (5 minutes)

**Risk**: Short window → legitimate retries may fail
**Mitigation**: Batch-level idempotency (cached response)

### S3: Clock Skew Attacks

**Attack**: Attacker sets timestamp far in future/past

**Mitigation**:
- Reject timestamps > ±90 seconds
- Log excessive skew for investigation
- Governance alerts on sustained skew

### S4: Denial of Service

**Attack Vectors**:
- Large batch sizes (> 100 items)
- Large payloads (> 5 MB)
- Rapid request rate (> 10/min)

**Mitigations**:
- Hard limits enforced at API layer
- 413/429 responses with retry-after
- Circuit breaker after sustained failures

## Versioning

**Current Version**: 1.0

**Version Negotiation**:
- Request includes `protocol_version` field
- Server checks version compatibility
- If incompatible: return 426 Upgrade Required

**Future Versions**:
- **1.1**: Add compression (gzip, brotli)
- **1.2**: Add encryption (AES-256-GCM)
- **2.0**: Binary protocol (protobuf, msgpack)

## Changelog

### 1.0.0 (2025-01-22)
- Initial protocol specification
- HMAC-SHA256 authentication
- Batch + item idempotency
- Anti-replay with nonce store
- Clock discipline with skew measurement
- SQLite ledger with JSONL export
- Pagination and backpressure
- Governance integration (G18)

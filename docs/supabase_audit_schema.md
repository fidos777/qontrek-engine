# Supabase Audit Log Schema & RLS Policies

**Version**: 1.0
**Last Updated**: 2025-01-22
**Release**: G19.9.2-R1.4.4

## Overview

This document defines the Supabase schema for the `audit_log` table used to mirror local `.logs/mcp/` entries to a verifiable offsite database. The schema prioritizes:
- **Privacy**: Only scrubbed, PII-free data is mirrored
- **Idempotency**: Duplicate events are rejected via unique `event_hash`
- **Tenant Isolation**: Row-Level Security (RLS) enforces per-tenant access
- **Auditability**: All events are immutable and timestamped

## Table Schema

### `audit_log`

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE,  -- Idempotency key
  panic_mode BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_event_hash ON audit_log(event_hash);  -- Unique constraint already indexes
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Composite index for common queries
CREATE INDEX idx_audit_log_tenant_timestamp ON audit_log(tenant_id, timestamp DESC);
```

### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | BIGSERIAL | Auto-incrementing primary key | NOT NULL, PRIMARY KEY |
| `tenant_id` | TEXT | Tenant identifier (e.g., "atlas-demo") | NOT NULL |
| `timestamp` | BIGINT | Unix timestamp (ms) from event | NOT NULL |
| `event_type` | TEXT | Event type (e.g., "ui.page.view", "tower.ack") | NOT NULL |
| `event_hash` | TEXT | SHA-256 hash for idempotency | NOT NULL, UNIQUE |
| `panic_mode` | BOOLEAN | Was system in panic mode when event occurred? | NOT NULL, DEFAULT false |
| `payload` | JSONB | Scrubbed event payload (PII redacted) | NOT NULL |
| `created_at` | TIMESTAMPTZ | When row was inserted into Supabase | NOT NULL, DEFAULT NOW() |

### Idempotency Design

**Event Hash Computation**:
```typescript
// Canonical representation: sorted keys, tenant_id + timestamp + event
const canonical = JSON.stringify({
  tenant_id: "atlas-demo",
  timestamp: 1737567890123,
  event: "ui.page.view"
}, Object.keys(event).sort());

const event_hash = sha256(canonical);
```

**Upsert Behavior**:
```typescript
// Insert with ON CONFLICT DO NOTHING
await client.from("audit_log").upsert(entry, {
  onConflict: "event_hash",
  ignoreDuplicates: true,
});
```

If `event_hash` already exists → skip insertion (no error, idempotent).

## Row-Level Security (RLS)

### Enable RLS

```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### Policy 1: Tenant Read Isolation

**Name**: `tenant_read_isolation`
**Operation**: SELECT
**Description**: Users can only read their own tenant's logs

```sql
CREATE POLICY tenant_read_isolation
ON audit_log
FOR SELECT
USING (
  tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'
);
```

**How It Works**:
- Supabase JWT contains `tenant_id` claim
- Policy extracts `tenant_id` from JWT and compares to row's `tenant_id`
- Only rows matching the authenticated tenant are visible

**Example JWT Payload**:
```json
{
  "sub": "user-123",
  "tenant_id": "atlas-demo",
  "role": "authenticated",
  "iat": 1737567890,
  "exp": 1737571490
}
```

### Policy 2: Service Role Write

**Name**: `service_role_write`
**Operation**: INSERT
**Description**: Only service role (mirror job) can insert logs

```sql
CREATE POLICY service_role_write
ON audit_log
FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
);
```

**How It Works**:
- Mirror job uses service role key (not user JWT)
- Policy checks that JWT role is `service_role`
- Regular users cannot insert logs directly

### Policy 3: Immutable Logs

**Name**: `immutable_logs`
**Operation**: UPDATE, DELETE
**Description**: No updates or deletes allowed (append-only)

```sql
-- No UPDATE policy defined → all updates blocked
-- No DELETE policy defined → all deletes blocked
```

**How It Works**:
- RLS is enabled but no UPDATE/DELETE policies exist
- All UPDATE/DELETE operations are denied by default
- Logs are immutable once inserted

## Privacy & PII Minimization

### What Gets Mirrored

**YES (scrubbed payload)**:
```json
{
  "event": "ui.page.view",
  "timestamp": 1737567890123,
  "page": "/dashboard",
  "user_agent": "Mozilla/5.0...",
  "panic_mode": false
}
```

**NO (PII redacted)**:
```json
{
  "email": "[email]",
  "phone": "[phone]",
  "credit_card": "[card]",
  "api_key": "[key]",
  "jwt": "[jwt]",
  "bearer": "[bearer]",
  "ip": "[ip]"
}
```

### Scrubbing Pipeline

```
Local log → lib/logs/scrub.ts → Scrubbed entry → Supabase
```

**Scrubber Patterns** (12 total):
- Email addresses
- Phone numbers (international + Malaysia)
- Credit cards (Visa, MC, Amex, Discover)
- API keys (generic patterns)
- JWT tokens (`eyJ...`)
- Bearer tokens
- IPv4/IPv6 addresses
- IBAN
- UUID v4 (future)
- AWS ARNs (future)
- Google API keys (future)
- Malaysia NRIC (future)

### Raw Logs Remain Local

**Important**: Raw `.logs/mcp/events.log.jsonl` files stay local and are **never** pushed to Supabase. Only scrubbed events are mirrored.

## Query Examples

### Count Events by Tenant

```sql
SELECT COUNT(*)
FROM audit_log
WHERE tenant_id = 'atlas-demo';
```

### Recent Events (Last 24h)

```sql
SELECT event_type, timestamp, panic_mode
FROM audit_log
WHERE tenant_id = 'atlas-demo'
  AND timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000
ORDER BY timestamp DESC
LIMIT 100;
```

### Panic Mode Events

```sql
SELECT event_type, timestamp, payload
FROM audit_log
WHERE tenant_id = 'atlas-demo'
  AND panic_mode = true
ORDER BY timestamp DESC;
```

### Event Type Distribution

```sql
SELECT event_type, COUNT(*) as count
FROM audit_log
WHERE tenant_id = 'atlas-demo'
GROUP BY event_type
ORDER BY count DESC;
```

## Backup & Retention

### Automated Backups

Supabase provides automated daily backups:
- **Free tier**: 7 days retention
- **Pro tier**: 30 days retention
- **Enterprise**: Custom retention

### Manual Export

```bash
# Export all logs for tenant
supabase db dump --data-only --table audit_log \
  --where "tenant_id = 'atlas-demo'" \
  > audit_log_export.sql
```

### Archival Policy (Recommended)

**Retention Strategy**:
- **Hot data**: 90 days in `audit_log`
- **Warm data**: 1 year in `audit_log_archive`
- **Cold data**: >1 year archived to S3 or Glacier

**Monthly Archival Job**:
```sql
-- Move logs older than 90 days to archive
INSERT INTO audit_log_archive
SELECT * FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Monitoring & Alerts

### Key Metrics

1. **Ingestion Rate**: Rows inserted per minute
2. **Idempotency Ratio**: Skipped / Processed (should be low)
3. **Error Rate**: Failed inserts / Total attempts
4. **Lag Time**: `created_at - timestamp` (should be < 5 min)

### Supabase Dashboard Queries

**Ingestion Rate (Last Hour)**:
```sql
SELECT
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as events
FROM audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```

**Lag Time P95**:
```sql
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM created_at) * 1000 - timestamp
  ) as p95_lag_ms
FROM audit_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Setup Instructions

### 1. Create Table

Run the schema SQL in Supabase SQL Editor:
```sql
-- Copy from "Table Schema" section above
```

### 2. Enable RLS

```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### 3. Create Policies

```sql
-- Copy policies from "Row-Level Security" section
```

### 4. Configure Environment

In `.env.local` (never commit):
```bash
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role key (secret)
ATLAS_TENANT_ID=atlas-demo
```

### 5. Test Mirror

```bash
# Run mirror manually
npm run mirror:test

# Check Supabase table
SELECT COUNT(*) FROM audit_log WHERE tenant_id = 'atlas-demo';
```

## Security Considerations

### S1: Service Role Key Protection

**Risk**: Service role key bypasses RLS
**Mitigation**:
- Store in GitHub Secrets (CI/CD)
- Never commit to `.env` files
- Rotate quarterly

### S2: JWT Claim Injection

**Risk**: Malicious JWT with fake `tenant_id`
**Mitigation**:
- Supabase verifies JWT signature
- Claims are read-only from signed token
- Use `aud` claim verification

### S3: Payload Size Limits

**Risk**: Large payloads cause OOM or quota exhaustion
**Mitigation**:
- Payload size cap: 100KB per event
- Truncate large fields before mirroring
- Monitor `pg_database_size()`

### S4: Rate Limiting

**Risk**: Excessive mirror runs exhaust database connections
**Mitigation**:
- Scheduled job runs once daily (02:00 UTC)
- Batch size: 100 events per transaction
- Connection pooling via Supabase client

## Troubleshooting

### Issue: Duplicate Key Violations

**Symptom**: `duplicate key value violates unique constraint "audit_log_event_hash_key"`

**Cause**: Event hash collision (very rare) or retry without idempotency

**Fix**: Ensure `ignoreDuplicates: true` in upsert options

### Issue: RLS Blocking Reads

**Symptom**: `SELECT COUNT(*) FROM audit_log` returns 0 despite data existing

**Cause**: JWT missing `tenant_id` claim or policy mismatch

**Fix**:
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Check data exists
SELECT COUNT(*) FROM audit_log;

-- Re-enable and fix JWT claims
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### Issue: Slow Queries

**Symptom**: Mirror job takes >10 seconds

**Cause**: Missing indexes or large batch size

**Fix**:
```sql
-- Verify indexes
\d audit_log

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM audit_log WHERE tenant_id = 'atlas-demo' LIMIT 100;
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Upsert](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
- [JSONB Indexing](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)

## Changelog

### 1.0.0 (2025-01-22)
- Initial schema with idempotency and RLS
- Tenant isolation policies
- Immutable append-only logs
- Privacy-first mirroring with PII scrubbing

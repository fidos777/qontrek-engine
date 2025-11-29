# Security Audit: RLS + Zero-Trust Validation

**Date**: 2025-11-29
**Scope**: Supabase Row-Level Security & Zero-Trust Model
**Severity Classification**: CRITICAL / HIGH / MEDIUM / LOW

---

## Executive Summary

This audit identified **12 critical/high severity issues** in the RLS and Zero-Trust implementation:

| Severity | Count | Category |
|----------|-------|----------|
| CRITICAL | 4 | Missing RLS policies, service key abuse |
| HIGH | 5 | Cross-tenant leakage, no JWT validation |
| MEDIUM | 3 | Governance bypass, weak client identification |

---

## Section 1: Row-Level Security (RLS) Validation

### CRITICAL-001: Empty RLS Migration Files

**Location**: `migrations/001_rls_enable.sql`
**Status**: EMPTY FILE (placeholder only)

**Evidence**:
```sql
-- File exists but contains NO RLS policies
-- Expected by tests in tests/test_monitor_views.py:
--   ALTER TABLE IF EXISTS public.events_raw ENABLE ROW LEVEL SECURITY
--   CREATE POLICY events_raw_brand_isolation ...
```

**Impact**: All tables are completely unprotected. Any authenticated user can read/write all tenant data.

**Expected Policies (from test assertions)**:
- `events_raw_brand_isolation`
- `wa_template_log_brand_isolation`
- `credit_logs_brand_isolation`
- `referrals_brand_isolation`

**Recommended Fix**:
```sql
-- migrations/001_rls_enable.sql

-- Enable RLS on all tenant tables
ALTER TABLE IF EXISTS public.events_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events_raw FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.wa_template_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wa_template_log FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.credit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals FORCE ROW LEVEL SECURITY;

-- Brand isolation policies
CREATE POLICY events_raw_brand_isolation ON public.events_raw
  FOR ALL
  USING (brand = current_setting('app.brand', true))
  WITH CHECK (brand = current_setting('app.brand', true));

CREATE POLICY wa_template_log_brand_isolation ON public.wa_template_log
  FOR ALL
  USING (brand = current_setting('app.brand', true))
  WITH CHECK (brand = current_setting('app.brand', true));

CREATE POLICY credit_logs_brand_isolation ON public.credit_logs
  FOR ALL
  USING (brand = current_setting('app.brand', true))
  WITH CHECK (brand = current_setting('app.brand', true));

CREATE POLICY referrals_brand_isolation ON public.referrals
  FOR ALL
  USING (brand = current_setting('app.brand', true))
  WITH CHECK (brand = current_setting('app.brand', true));
```

---

### CRITICAL-002: Empty ops_logs Migration

**Location**: `migrations/002_ops_logs.sql`
**Status**: EMPTY FILE

**Evidence**: Test `test_ops_logs_table_and_index_defined()` expects table creation with RLS, but file is empty.

**Recommended Fix**:
```sql
-- migrations/002_ops_logs.sql
CREATE TABLE IF NOT EXISTS public.ops_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    flow text NOT NULL,
    node text NOT NULL,
    status text NOT NULL,
    request_id text,
    idempotency_key text NOT NULL,
    latency_ms integer DEFAULT 0,
    error_code text,
    error_msg text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX ops_logs_brand_created_at_idx ON public.ops_logs (brand, created_at DESC);
CREATE UNIQUE INDEX ops_logs_idempotency_idx ON public.ops_logs (brand, idempotency_key);

ALTER TABLE public.ops_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY ops_logs_brand_isolation ON public.ops_logs
  FOR ALL
  USING (brand = current_setting('app.brand', true))
  WITH CHECK (brand = current_setting('app.brand', true));
```

---

### CRITICAL-003: Empty Reconcile View Migration

**Location**: `migrations/003_reconcile_view.sql`
**Status**: EMPTY FILE

**Evidence**: Test expects `vw_unmetered_24h` view with brand filtering.

**Recommended Fix**:
```sql
-- migrations/003_reconcile_view.sql
CREATE OR REPLACE VIEW public.vw_unmetered_24h AS
SELECT
    w.brand,
    w.idempotency_key,
    w.request_id,
    w.template_name,
    w.created_at,
    CASE WHEN c.id IS NULL THEN true ELSE false END AS missing_credit
FROM public.wa_template_log w
LEFT JOIN public.credit_logs c
    ON w.brand = c.brand
    AND w.idempotency_key = c.idempotency_key
WHERE w.status = 'sent'
    AND w.created_at >= now() - INTERVAL '24 hours'
    AND w.brand = current_setting('app.brand', true);

-- Note: Views inherit RLS from underlying tables, but add explicit filter
```

---

### CRITICAL-004: Empty ops_alerts Migration

**Location**: `migrations/006_ops_alerts.sql`
**Status**: EMPTY FILE

**Recommended Fix**:
```sql
-- migrations/006_ops_alerts.sql
CREATE OR REPLACE VIEW public.ops_alerts AS
SELECT
    brand,
    flow,
    node,
    COUNT(*) AS event_count,
    AVG(latency_ms) AS avg_latency_ms,
    ARRAY_AGG(DISTINCT error_code) FILTER (WHERE error_code IS NOT NULL) AS error_codes
FROM public.ops_logs
WHERE created_at >= now() - INTERVAL '1 hour'
    AND status IN ('error', 'failed')
    AND brand = current_setting('app.brand', true)
GROUP BY brand, flow, node
ORDER BY event_count DESC;
```

---

### HIGH-001: View Without RLS Enforcement

**Location**: `migrations/002_template_picker.sql:1-18`

**Issue**: `vw_templates_by_price` view does NOT filter by brand.

```sql
-- Current (INSECURE):
CREATE OR REPLACE VIEW public.vw_templates_by_price AS
SELECT ranked.brand, ranked.locale, ranked.template_name, ranked.unit_price_rm
FROM ( SELECT wt.brand, ... FROM public.whatsapp_templates wt ) AS ranked
WHERE ranked.price_rank = 1;
```

**Impact**: Any tenant can see ALL brands' template pricing.

**Recommended Fix**:
```sql
CREATE OR REPLACE VIEW public.vw_templates_by_price
WITH (security_invoker = true) AS
SELECT ranked.brand, ranked.locale, ranked.template_name, ranked.unit_price_rm
FROM (
    SELECT wt.brand, wt.locale, wt.template_name, wt.unit_price_rm,
           ROW_NUMBER() OVER (PARTITION BY wt.brand, wt.locale
                              ORDER BY wt.unit_price_rm ASC) AS price_rank
    FROM public.whatsapp_templates wt
    WHERE wt.brand = current_setting('app.brand', true)
) AS ranked
WHERE ranked.price_rank = 1;
```

---

### HIGH-002: Referrals Table Missing RLS

**Location**: `migrations/005_referrals_patch.sql`

**Issue**: Adds columns and indexes but NO RLS policy.

**Recommended Fix**: Add to `001_rls_enable.sql` as shown in CRITICAL-001.

---

## Section 2: Cross-Tenant Leakage Risks

### HIGH-003: Service Key Bypasses All RLS

**Locations**:
- `agent_runner.py:32`
- `agent_logger.py:7-9`
- `scripts/proof_push_supabase.py:10`
- `scripts/reconcile_job.py:31-33`
- `scripts/preflight.py:93-94`

**Issue**: Python scripts use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely.

```python
# agent_logger.py:7-9
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # DANGEROUS
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

**Impact**: All Python backend operations can read/write ANY tenant's data.

**Recommended Fixes**:

1. **Use anon key + set app.brand context**:
```python
# Preferred pattern
def get_brand_scoped_client(brand: str):
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    # Set brand context via RPC
    client.rpc('set_brand_context', {'brand': brand}).execute()
    return client
```

2. **Create RPC function**:
```sql
CREATE OR REPLACE FUNCTION set_brand_context(brand text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.brand', brand, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### HIGH-004: Optional Brand Filtering in Reconcile Job

**Location**: `scripts/reconcile_job.py:72-79`

```python
def fetch_unmetered(client: SupabaseRestClient, brand: Optional[str] = None):
    params = { ... }
    if brand:  # OPTIONAL! Can be None
        params["brand"] = f"eq.{brand}"
```

**Impact**: If `--brand` flag is omitted, fetches ALL tenants' unmetered data.

**Recommended Fix**:
```python
def fetch_unmetered(client: SupabaseRestClient, brand: str):  # Required, not optional
    if not brand:
        raise ValueError("brand is required for tenant isolation")
    params["brand"] = f"eq.{brand}"
```

---

### MEDIUM-001: agent_logger Missing Brand Context

**Location**: `agent_logger.py:11-25`

```python
def log_agent_run(agent_name, prompt_hash, status="success", ...):
    data = {
        "agent_name": agent_name,
        # NO brand/tenant_id field!
    }
    response = supabase.table("agent_logs").insert(data).execute()
```

**Impact**: Agent logs have no tenant association - cannot enforce RLS.

**Recommended Fix**:
```python
def log_agent_run(agent_name, prompt_hash, brand: str, status="success", ...):
    if not brand:
        raise ValueError("brand is required")
    data = {
        "agent_name": agent_name,
        "brand": brand,  # Required field
        # ...
    }
```

---

## Section 3: Zero-Trust Validation

### HIGH-005: No JWT Tenant Validation in API Routes

**Locations**:
- `cockpit-ui/app/api/tower/uploadProof/route.ts`
- `cockpit-ui/app/api/mcp/governance/route.ts`
- `cockpit-ui/app/api/mcp/tail/route.ts`

**Issue**: None of these routes validate that the JWT's tenant claim matches the request.

```typescript
// uploadProof/route.ts - NO JWT validation
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { manifest } = body;
    // No check: does caller's JWT allow access to this manifest's tenant?
```

**Zero-Trust Principle Violated**: "JWT must always match tenant_id"

**Recommended Fix**:
```typescript
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    // Extract and validate JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify tenant claim matches request
    const userTenant = user.app_metadata?.tenant_id;
    const requestTenant = body.manifest?.tenant_id;

    if (requestTenant && requestTenant !== userTenant) {
        return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 });
    }

    // Set brand context for any subsequent DB operations
    await supabase.rpc('set_brand_context', { brand: userTenant });

    // ... rest of handler
}
```

---

### MEDIUM-002: Weak Client Identification in Rate Limiter

**Location**: `cockpit-ui/app/api/mcp/tail/route.ts:64-69`

```typescript
function getClientId(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    return `${ip}_${ua.substring(0, 50)}`;  // Easily spoofable!
}
```

**Issue**: Client identification uses IP+UserAgent, not JWT identity.

**Impact**:
- Rate limits can be bypassed by changing User-Agent
- No audit trail of which tenant made requests

**Recommended Fix**:
```typescript
async function getClientId(request: NextRequest): Promise<string> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                return `user_${user.id}`;  // Cryptographically verified identity
            }
        } catch {}
    }
    // Fallback for unauthenticated endpoints only
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    return `anon_${ip}`;
}
```

---

### MEDIUM-003: Direct DB Queries Bypass Governance Layer

**Location**: `agent_runner.py:60-91`

```python
def _sb_select(path: str, params: Dict[str, Any]):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_sb_headers(),  # Uses service key
        params=params,
        timeout=15,
    )
```

**Zero-Trust Principle Violated**: "no direct DB queries bypassing governance"

**Issue**: Direct REST API calls with service key skip all governance checks.

**Recommended Architecture**:
```
┌─────────────┐     ┌──────────────────┐     ┌───────────┐
│   Python    │────▶│  Governance API  │────▶│ Supabase  │
│   Scripts   │     │  (validates JWT, │     │  (with    │
│             │     │   sets brand,    │     │   RLS)    │
│             │     │   logs actions)  │     │           │
└─────────────┘     └──────────────────┘     └───────────┘
```

**Recommended Fix**:
```python
# Create governance client wrapper
class GovernanceClient:
    def __init__(self, jwt_token: str, brand: str):
        self.token = jwt_token
        self.brand = brand
        self._validate_token()

    def _validate_token(self):
        # Validate JWT and extract tenant
        # Ensure self.brand matches JWT claim
        pass

    def query(self, table: str, params: dict):
        # Always include brand filter
        params['brand'] = f'eq.{self.brand}'
        # Use anon key, let RLS enforce
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {self.token}',
        }
        return requests.get(..., headers=headers)
```

---

## Section 4: Privilege Escalation Risks

### MEDIUM-004: Signing Key in Environment Variable

**Location**: `cockpit-ui/lib/tower/signing.ts:22-35`

```typescript
export function getActiveSigningKey(): SigningKey {
    const secret = process.env.TOWER_SIGNING_SECRET || 'dev-tower-secret-change-in-production';
    // ...
}
```

**Issue**: Default fallback secret in production code; key accessible to all processes.

**Recommended Fixes**:
1. Remove default fallback:
```typescript
const secret = process.env.TOWER_SIGNING_SECRET;
if (!secret) {
    throw new Error('TOWER_SIGNING_SECRET is required');
}
```

2. Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## Section 5: Summary of Required Fixes

### Immediate (CRITICAL):
1. Populate `migrations/001_rls_enable.sql` with RLS policies
2. Populate `migrations/002_ops_logs.sql` with table + RLS
3. Populate `migrations/003_reconcile_view.sql` with brand-scoped view
4. Populate `migrations/006_ops_alerts.sql` with brand-scoped view

### Short-term (HIGH):
5. Add JWT validation to all API routes
6. Add brand context to `agent_logger.py`
7. Make brand parameter required in `reconcile_job.py`
8. Replace service key usage with anon key + RLS

### Medium-term (MEDIUM):
9. Implement governance API layer for Python scripts
10. Use JWT-based client identification in rate limiter
11. Add `SECURITY INVOKER` to all views
12. Remove default secret fallbacks

---

## Appendix: Test Gap Analysis

The test file `tests/test_monitor_views.py` correctly expects RLS policies, but the **tests are passing due to file reading, not actual policy validation**. The tests read file contents but don't verify policies are applied in the database.

**Recommendation**: Add integration tests that actually query Supabase:
```python
def test_rls_blocks_cross_tenant_read():
    # As tenant A, try to read tenant B's data
    client_a = get_client_for_tenant('voltek')
    client_a.set_config('app.brand', 'voltek')

    result = client_a.from_('events_raw').select('*').eq('brand', 'perodua').execute()
    assert len(result.data) == 0, "Cross-tenant read should return no data"
```

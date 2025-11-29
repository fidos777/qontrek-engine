# 🔥 ADVERSARIAL / RED-TEAM SECURITY ASSESSMENT

**Assessment Date:** 2025-11-29
**Scope:** G14 Drift Detection, RLS, Multi-Party Lane Segregation, MCP Validation, Multi-Tenancy
**Classification:** INTERNAL - For Authorized Security Review Only

---

## TABLE OF CONTENTS

1. [G14 Drift Detection Bypass](#1-g14-drift-detection-bypass)
2. [RLS (Row-Level Security) Bypass](#2-rls-row-level-security-bypass)
3. [Multi-Party Lane Segregation Bypass](#3-multi-party-lane-segregation-bypass)
4. [Malformed MCP Request Injection](#4-malformed-mcp-request-injection)
5. [Multi-Tenancy Attack Scenarios](#5-multi-tenancy-attack-scenarios)
6. [Summary Risk Matrix](#6-summary-risk-matrix)
7. [Recommended Mitigations](#7-recommended-mitigations)

---

## 1. G14 DRIFT DETECTION BYPASS

### 1.1 Vulnerability: Threshold Manipulation via Gradual Drift

**Location:** `scripts/autonomy_score_drift.py:15-29`

**Exploit Path:**
```python
# Current severity calculation:
def calculate_severity(report):
  severity = 0.0
  for entry in report.get("entries", []):
    delta_success = abs(float(entry.get("delta_success_rate") or 0))
    # ...
    severity = max(severity, component)
  return round(min(severity, 1.0), 4)
```

**Attack Vector:**
1. Attacker introduces small incremental changes (delta_success_rate = 0.09) each day
2. Each change stays under the "warning" threshold (0.2)
3. Over 10 cycles, cumulative drift reaches 0.9 (critical) without triggering alerts
4. The `max()` aggregation only captures point-in-time deltas, not cumulative drift

**Fix Recommendation:**
```python
# Add cumulative drift tracking
def calculate_severity(report, historical_scores=None):
  point_severity = calculate_point_severity(report)
  cumulative_severity = calculate_cumulative_drift(report, historical_scores)
  return max(point_severity, cumulative_severity)
```

### 1.2 Vulnerability: Report File Tampering

**Location:** `scripts/autonomy_score_drift.py:9-12`

**Exploit Path:**
```python
def load_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    raise SystemExit(f"Missing file {path}")
  return json.loads(path.read_text())  # No integrity verification!
```

**Attack Vector:**
1. Attacker gains write access to `proof/autonomy/drift_report.json`
2. Modifies `delta_success_rate`, `delta_retry_rate` values to 0
3. All entries show "normal" classification despite actual drift
4. No HMAC or signature verification on input files

**Fix Recommendation:**
- Add HMAC signature verification for drift report files
- Store report hash in immutable ledger before processing
- Cross-reference with independent metrics source

### 1.3 Vulnerability: Policy Diff Bypass via Naming Convention

**Location:** `scripts/policy_diff.py:17-19`

**Exploit Path:**
```python
material_markers = ("threshold", "rule", "policy", "limit")
material = any(any(marker in key for marker in material_markers) for key in diff_keys)
```

**Attack Vector:**
1. Rename policy keys to avoid detection:
   - `rate_threshold` → `rate_max_value` (no "threshold" keyword)
   - `approval_policy` → `approval_config` (no "policy" keyword)
2. Changes classified as "cosmetic" instead of "material"
3. Bypasses governance escalation

**Fix Recommendation:**
```python
# Use semantic diff analysis, not keyword matching
def classify_diff(before, after):
  # Check value type changes
  # Check value magnitude changes (>10% = material)
  # Check key additions/removals in critical sections
```

---

## 2. RLS (ROW-LEVEL SECURITY) BYPASS

### 2.1 CRITICAL: Direct Database Connection Bypass

**Location:** RLS relies entirely on `app.brand` configuration

**Exploit Path:**
1. Attacker obtains database connection string (leaked in logs, env vars)
2. Connects directly to PostgreSQL/Supabase without going through application
3. `app.brand` is never set → RLS policies return empty (fail-open on some configs)
4. Or uses service role key which bypasses RLS entirely

**Attack Scenario:**
```sql
-- Direct connection without app context
psql $DATABASE_URL
SELECT * FROM ops_logs;  -- Returns ALL tenant data if policy is permissive
```

**Fix Recommendation:**
- Ensure RLS policies are RESTRICTIVE not PERMISSIVE
- Use `USING (false)` as default policy
- Require `auth.jwt() ->> 'brand'` from signed JWT, not session variable
- Never expose service role key outside trusted backend

### 2.2 Vulnerability: Missing RLS on Views

**Location:** `cockpit-ui/__tests__/supabase-rls.test.ts:104-111`

**Exploit Path:**
The test assumes views inherit RLS, but PostgreSQL views execute with definer's privileges unless explicitly configured:

```sql
-- If view was created with SECURITY DEFINER:
CREATE VIEW vw_unmetered_24h WITH (security_invoker = false) AS
  SELECT * FROM ops_logs;  -- Bypasses RLS!
```

**Attack Vector:**
1. Query views directly instead of base tables
2. If `security_invoker` is not set on views, RLS is bypassed
3. All tenant data exposed through view queries

**Fix Recommendation:**
```sql
-- Ensure all views use security_invoker
CREATE OR REPLACE VIEW vw_unmetered_24h
WITH (security_invoker = true) AS ...
```

### 2.3 Vulnerability: Brand Injection via Session Variable

**Location:** Mock client `setConfig('app.brand', value)`

**Exploit Path:**
```typescript
// If any code path allows user-controlled brand value:
await client.setConfig('app.brand', userInput);  // userInput = '*' or 'voltek" OR 1=1 --'
```

**Attack Vector:**
1. Inject malicious brand value through unvalidated input
2. SQL injection in RLS policy if brand is interpolated unsafely
3. Wildcard patterns may match all tenants

**Fix Recommendation:**
- Validate brand against whitelist of known tenants
- Never accept brand value from user input directly
- Derive brand from authenticated JWT claims only

---

## 3. MULTI-PARTY LANE SEGREGATION BYPASS

### 3.1 CRITICAL: Hardcoded Development Secrets

**Location:** `cockpit-ui/lib/tower/signing.ts:23`

**Exploit Path:**
```typescript
const secret = process.env.TOWER_SIGNING_SECRET || 'dev-tower-secret-change-in-production';
```

**Attack Vector:**
1. If `TOWER_SIGNING_SECRET` env var is unset in production
2. Default secret `dev-tower-secret-change-in-production` is used
3. Attacker can forge Tower signatures with publicly known key

**Same Issue in:** `scripts/buildGenesis.js:138`
```javascript
const factorySecret = process.env.FACTORY_SIGNING_SECRET || 'dev-factory-secret';
```

**Fix Recommendation:**
```typescript
const secret = process.env.TOWER_SIGNING_SECRET;
if (!secret || secret.includes('dev-')) {
  throw new Error('TOWER_SIGNING_SECRET not set or using development secret in production');
}
```

### 3.2 Vulnerability: Factory Signature Accepted Without Verification

**Location:** `cockpit-ui/app/api/tower/uploadProof/route.ts:86-92`

**Exploit Path:**
```typescript
// Co-sign accepts factory signature without verification!
const signatures = coSign(
  manifestClone,
  manifest.signature,  // Factory signature passed through, not verified
  towerKey
);
```

**Attack Vector:**
1. Attacker submits arbitrary `manifest.signature` value
2. Tower co-signs without validating factory signature authenticity
3. Forged factory+tower dual-signed package created
4. Multi-party guarantee broken - single party (Tower) effectively signs

**Fix Recommendation:**
```typescript
// Verify factory signature before co-signing
const factoryKey = await getFactoryPublicKey(manifest.kid);
if (!verifySignature(manifestClone, manifest.signature, factoryKey)) {
  return NextResponse.json({ error: 'Invalid factory signature' }, { status: 403 });
}
// Only then proceed to co-sign
```

### 3.3 Vulnerability: Key ID (kid) Spoofing

**Location:** `cockpit-ui/lib/tower/signing.ts:29`

**Exploit Path:**
```typescript
kid: process.env.TOWER_KEY_ID || 'tower-key-001',
```

**Attack Vector:**
1. Attacker guesses common key IDs: `tower-key-001`, `factory-key-001`
2. Submits manifest with matching `kid`
3. System accepts signature without validating key ownership

**Fix Recommendation:**
- Implement key registry with cryptographic binding
- Require key registration before first use
- Use asymmetric keys with public key pinning

---

## 4. MALFORMED MCP REQUEST INJECTION

### 4.1 CRITICAL: Dual Nonce Validation with Hardcoded Bypass

**Location:** `retriever/utils/nonce_checker.py:24-27`

**Exploit Path:**
```python
def is_valid_nonce(nonce):
    # Simple check — you can replace this with a token validator
    return nonce == "voltek123"  # HARDCODED BYPASS!
```

**Attack Vector:**
1. Any request with `nonce: "voltek123"` bypasses all validation
2. This appears to be a debugging backdoor left in production code
3. Complete authentication bypass for MCP requests

**Fix Recommendation:**
- Remove hardcoded nonce check immediately
- Use only HMAC-based validation (`validate_nonce()`)
- Add monitoring for attempts using known test values

### 4.2 Vulnerability: Nonce Store Race Condition

**Location:** `cockpit-ui/lib/security/nonceStore.ts:135-148`

**Exploit Path:**
```typescript
export async function checkAndStoreNonce(nonce, context, ttlSeconds = 3600) {
  const exists = await hasNonce(nonce, context);  // Check
  if (exists) return false;
  await storeNonce(nonce, context, ttlSeconds);   // Store
  return true;
}
```

**Attack Vector (TOCTOU Race Condition):**
1. Attacker sends same nonce in two parallel requests
2. Both requests pass `hasNonce()` check (nonce not yet stored)
3. Both requests succeed before either stores the nonce
4. Replay attack succeeds

**Fix Recommendation:**
```typescript
// Use INSERT with UNIQUE constraint + conflict handling
export async function checkAndStoreNonce(nonce, context) {
  try {
    await db.run(
      'INSERT INTO nonces (nonce, context, ...) VALUES (?, ?, ...)',
      [nonce, context, ...]
    );
    return true;  // New nonce
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') return false;  // Duplicate
    throw e;
  }
}
```

### 4.3 Vulnerability: Rate Limiter Bypass via Client ID Rotation

**Location:** `cockpit-ui/app/api/mcp/tail/route.ts:64-69`

**Exploit Path:**
```typescript
function getClientId(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}_${ua.substring(0, 50)}`;
}
```

**Attack Vector:**
1. Attacker rotates User-Agent header each request
2. Each unique UA creates new rate limit bucket
3. 100 requests × 1000 unique UAs = 100,000 requests/minute
4. DoS possible despite rate limiting

**Fix Recommendation:**
- Use IP-only rate limiting or authenticated user ID
- Add global rate limit across all client IDs
- Implement progressive backoff for suspicious patterns

### 4.4 Vulnerability: Path Traversal in Log Path

**Location:** `cockpit-ui/app/api/mcp/tail/route.ts:104-109`

**Exploit Path:**
```typescript
const logPath = join(
  process.cwd(),
  '..',
  'logs',
  'mcp',
  'runtime.jsonl'
);
```

While the current path is hardcoded, if a `logFile` query parameter were added:

```typescript
// Vulnerable pattern:
const logPath = join(process.cwd(), '..', 'logs', request.query.logFile);
// Attack: ?logFile=../../../etc/passwd
```

**Fix Recommendation:**
- Validate any user-provided file paths against allowlist
- Use `path.basename()` to strip directory traversal
- Never allow user input in file paths without sanitization

---

## 5. MULTI-TENANCY ATTACK SCENARIOS

### SCENARIO A: Cross-Tenant Data Exfiltration

**Attacker Profile:** Malicious tenant "evilcorp" with valid credentials

**Attack Chain:**
1. **Reconnaissance:** Attacker queries their own data, observes response structure
2. **Brand Enumeration:** Attacker tries common brand names: `voltek`, `perodua`, `test`, `demo`
3. **Session Hijacking:** If JWT contains brand claim, attacker intercepts/modifies JWT
4. **Direct DB Access:** Attacker uses leaked connection string (from error messages, logs)
5. **Exfiltration:** All tenant data accessible via direct SQL

**Detection Gaps:**
- No alerting on brand mismatch attempts
- No logging of RLS policy rejections
- No anomaly detection on query patterns

**Mitigation:**
```typescript
// Add brand mismatch audit logging
if (requestBrand !== sessionBrand) {
  auditLog.critical('BRAND_MISMATCH_ATTEMPT', {
    requestedBrand: requestBrand,
    sessionBrand: sessionBrand,
    userId: user.id,
    ip: request.ip
  });
  throw new SecurityError('Access denied');
}
```

### SCENARIO B: Unauthorized Actor Impersonation

**Attacker Profile:** Compromised Tower service account

**Attack Chain:**
1. **Key Extraction:** Attacker extracts `TOWER_SIGNING_SECRET` from Tower container
2. **Signature Forgery:** Attacker generates valid Tower signatures for any manifest
3. **Factory Impersonation:** Since Tower accepts factory signatures without verification, attacker signs as "Factory"
4. **Malicious Payload:** Attacker injects malicious code into signed manifest
5. **Deployment:** System trusts dual-signed package, deploys malicious code

**Detection Gaps:**
- No signature source validation
- No cross-check with Factory for signature authenticity
- No key usage monitoring

**Mitigation:**
- Implement mutual TLS between Factory and Tower
- Add out-of-band signature verification channel
- Monitor signing key usage patterns

### SCENARIO C: Rogue Workflow Execution

**Attacker Profile:** Insider with CI/CD access

**Attack Chain:**
1. **Policy Evasion:** Attacker renames governance policy keys to avoid `material_markers` detection
   ```json
   // Before: "approval_threshold": 100
   // After: "approval_max_val": 1  // Bypasses keyword detection
   ```
2. **Drift Masking:** Attacker modifies drift reports to show `delta_success_rate: 0`
3. **Genesis Forgery:** Using default dev secrets, attacker creates valid-looking Genesis package
4. **Workflow Trigger:** Attacker triggers recertification with forged credentials
5. **Persistent Access:** Rogue workflow deployed with backdoor

**Detection Gaps:**
- Semantic policy changes not detected by keyword matching
- Drift report integrity not verified
- Genesis creation audit trail incomplete

**Mitigation:**
- Implement semantic diff analysis for policies
- Add cryptographic integrity verification for all proof files
- Require multi-party approval for Genesis creation

---

## 6. SUMMARY RISK MATRIX

| Vulnerability | Severity | Exploitability | Impact | Risk Score |
|--------------|----------|----------------|--------|------------|
| Hardcoded nonce bypass (`voltek123`) | **CRITICAL** | Easy | Complete auth bypass | **10.0** |
| Hardcoded dev secrets in production | **CRITICAL** | Easy | Signature forgery | **9.8** |
| Factory signature not verified | **HIGH** | Medium | Multi-party bypass | **8.5** |
| Nonce TOCTOU race condition | **HIGH** | Medium | Replay attacks | **8.0** |
| Rate limiter UA rotation bypass | **HIGH** | Easy | DoS | **7.5** |
| RLS service role bypass | **HIGH** | Medium | Full data access | **8.5** |
| Gradual drift evasion | **MEDIUM** | Hard | Compliance bypass | **6.5** |
| Policy diff keyword evasion | **MEDIUM** | Medium | Governance bypass | **6.0** |
| View security_invoker gap | **MEDIUM** | Medium | Data leak | **6.0** |
| Brand session variable injection | **MEDIUM** | Hard | Tenant escape | **5.5** |

---

## 7. RECOMMENDED MITIGATIONS

### Immediate Actions (P0 - Fix Within 24 Hours)

1. **Remove hardcoded nonce bypass**
   - File: `retriever/utils/nonce_checker.py:24-27`
   - Action: Delete `is_valid_nonce()` function entirely

2. **Enforce production secrets**
   - Files: `signing.ts:23`, `buildGenesis.js:138`
   - Action: Add runtime check that rejects dev secrets in production

3. **Verify factory signatures before co-signing**
   - File: `uploadProof/route.ts:86`
   - Action: Add signature verification step

### Short-Term Actions (P1 - Fix Within 1 Week)

4. **Fix nonce store race condition**
   - Use atomic INSERT with conflict detection
   - Add distributed lock for clustered deployments

5. **Implement semantic policy diff**
   - Replace keyword matching with value-based change detection
   - Track cumulative policy drift

6. **Add RLS security_invoker audit**
   - Verify all views use `security_invoker = true`
   - Add test coverage for view-based access

### Long-Term Actions (P2 - Fix Within 1 Month)

7. **Implement cumulative drift tracking**
   - Store historical drift scores
   - Alert on cumulative threshold breach

8. **Add brand claim to JWT**
   - Remove reliance on session variables
   - Sign brand in access token

9. **Implement cryptographic proof chain**
   - Sign all proof files with Factory key
   - Verify chain of custody before processing

10. **Add comprehensive audit logging**
    - Log all RLS rejections
    - Monitor for brand mismatch attempts
    - Alert on unusual query patterns

---

## APPENDIX: ATTACK SIMULATION SCRIPTS

The following scripts can be used for authorized penetration testing:

```bash
# Test 1: Nonce bypass
curl -X POST /api/mcp/submit \
  -d '{"nonce": "voltek123", "agent": "attacker", "message": "pwned"}'

# Test 2: Rate limiter bypass
for i in {1..1000}; do
  curl -H "User-Agent: test-$i" /api/mcp/tail
done

# Test 3: Dev secret exploitation
export TOWER_SIGNING_SECRET=""  # Force fallback to dev secret
node scripts/buildGenesis.js  # Creates valid-looking package with known key
```

---

**Report Prepared By:** Security Assessment Team
**Review Status:** Pending remediation verification

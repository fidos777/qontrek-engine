-- =============================================================================
-- Qontrek OS Layer 1 - RLS Test Queries
-- =============================================================================
-- These queries verify tenant isolation is working correctly.
-- Run these tests to ensure one tenant cannot see another's data.
-- =============================================================================

-- =============================================================================
-- SETUP: Create Test Tenants and Data
-- =============================================================================

BEGIN;

-- Create two test tenants
INSERT INTO public.tenants (id, name, slug) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Tenant Alpha', 'tenant-alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Tenant Beta', 'tenant-beta')
ON CONFLICT (slug) DO NOTHING;

-- Create test leads for Tenant Alpha
INSERT INTO public.leads (tenant_id, name, phone, email, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alpha Lead 1', '+60123456789', 'lead1@alpha.com', 'new'),
    ('11111111-1111-1111-1111-111111111111', 'Alpha Lead 2', '+60123456790', 'lead2@alpha.com', 'qualified'),
    ('11111111-1111-1111-1111-111111111111', 'Alpha Lead 3', '+60123456791', 'lead3@alpha.com', 'converted');

-- Create test leads for Tenant Beta
INSERT INTO public.leads (tenant_id, name, phone, email, status) VALUES
    ('22222222-2222-2222-2222-222222222222', 'Beta Lead 1', '+60198765432', 'lead1@beta.com', 'new'),
    ('22222222-2222-2222-2222-222222222222', 'Beta Lead 2', '+60198765433', 'lead2@beta.com', 'qualified');

-- Create test pipelines for each tenant
INSERT INTO public.pipelines (tenant_id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alpha Sales Pipeline', 'Main sales pipeline for Alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Beta Sales Pipeline', 'Main sales pipeline for Beta');

-- Create test proofs for each tenant
INSERT INTO public.proofs (tenant_id, name, sha256, proof_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alpha_config_v1', 'abc123hash', 'config'),
    ('22222222-2222-2222-2222-222222222222', 'beta_config_v1', 'def456hash', 'config');

-- Create test governance logs
INSERT INTO public.governance_logs (tenant_id, action, actor_role, resource_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'CREATE_LEAD', 'admin', 'lead'),
    ('22222222-2222-2222-2222-222222222222', 'UPDATE_PIPELINE', 'manager', 'pipeline');

COMMIT;

-- =============================================================================
-- TEST 1: Verify Tenant Isolation for LEADS
-- =============================================================================
-- Expected: Each tenant should only see their own leads

-- Set context as Tenant Alpha
SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);

-- Query leads - should only return Alpha's 3 leads
SELECT 'TEST 1A: Leads visible to Tenant Alpha' AS test_name;
SELECT id, name, tenant_id FROM public.leads;
-- Expected: 3 rows (Alpha Lead 1, 2, 3)

-- Set context as Tenant Beta
SELECT set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);

-- Query leads - should only return Beta's 2 leads
SELECT 'TEST 1B: Leads visible to Tenant Beta' AS test_name;
SELECT id, name, tenant_id FROM public.leads;
-- Expected: 2 rows (Beta Lead 1, 2)

-- =============================================================================
-- TEST 2: Verify Tenant Isolation for PIPELINES
-- =============================================================================

-- Set context as Tenant Alpha
SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);

SELECT 'TEST 2A: Pipelines visible to Tenant Alpha' AS test_name;
SELECT id, name, tenant_id FROM public.pipelines;
-- Expected: 1 row (Alpha Sales Pipeline)

-- Set context as Tenant Beta
SELECT set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);

SELECT 'TEST 2B: Pipelines visible to Tenant Beta' AS test_name;
SELECT id, name, tenant_id FROM public.pipelines;
-- Expected: 1 row (Beta Sales Pipeline)

-- =============================================================================
-- TEST 3: Verify Tenant Isolation for PROOFS
-- =============================================================================

SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);

SELECT 'TEST 3A: Proofs visible to Tenant Alpha' AS test_name;
SELECT id, name, sha256, tenant_id FROM public.proofs;
-- Expected: 1 row (alpha_config_v1)

SELECT set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);

SELECT 'TEST 3B: Proofs visible to Tenant Beta' AS test_name;
SELECT id, name, sha256, tenant_id FROM public.proofs;
-- Expected: 1 row (beta_config_v1)

-- =============================================================================
-- TEST 4: Verify Tenant Isolation for GOVERNANCE_LOGS
-- =============================================================================

SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);

SELECT 'TEST 4A: Governance logs visible to Tenant Alpha' AS test_name;
SELECT id, action, actor_role, tenant_id FROM public.governance_logs;
-- Expected: 1 row (CREATE_LEAD)

SELECT set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);

SELECT 'TEST 4B: Governance logs visible to Tenant Beta' AS test_name;
SELECT id, action, actor_role, tenant_id FROM public.governance_logs;
-- Expected: 1 row (UPDATE_PIPELINE)

-- =============================================================================
-- TEST 5: Cross-Tenant Insert Attempt (Should Fail)
-- =============================================================================

-- Set context as Tenant Alpha
SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);

-- Attempt to insert a lead for Tenant Beta (should fail RLS check)
SELECT 'TEST 5: Cross-tenant insert attempt' AS test_name;
-- This INSERT should fail or insert with wrong tenant_id and become invisible
-- INSERT INTO public.leads (tenant_id, name)
-- VALUES ('22222222-2222-2222-2222-222222222222', 'Malicious Lead');
-- Expected: RLS violation error or row not visible

-- =============================================================================
-- TEST 6: Verify Helper Functions Work
-- =============================================================================

SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);
SELECT set_config('app.user_role', 'admin', true);

SELECT 'TEST 6: Helper function outputs' AS test_name;
SELECT
    auth.tenant_id() AS current_tenant_id,
    auth.user_role() AS current_user_role;
-- Expected: tenant_id = 11111111-..., role = admin

-- =============================================================================
-- TEST 7: Governance Log Immutability Test
-- =============================================================================

SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);
SELECT set_config('app.user_role', 'admin', true);

SELECT 'TEST 7: Governance log update attempt (should fail)' AS test_name;
-- This UPDATE should fail due to RLS policy
-- UPDATE public.governance_logs SET action = 'HACKED'
-- WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
-- Expected: 0 rows updated (policy blocks all updates)

-- =============================================================================
-- TEST 8: Count Verification
-- =============================================================================

-- Without any tenant context, should return 0 rows (no tenant_id matches NULL)
SELECT set_config('app.tenant_id', '', true);

SELECT 'TEST 8: Query without tenant context' AS test_name;
SELECT COUNT(*) AS leads_visible FROM public.leads;
-- Expected: 0 (no tenant_id = NULL)

-- =============================================================================
-- CLEANUP: Remove Test Data (Optional)
-- =============================================================================

-- Uncomment to clean up test data:
/*
BEGIN;

DELETE FROM public.governance_logs
WHERE tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.proofs
WHERE tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.pipelines
WHERE tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.leads
WHERE tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.tenants
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

COMMIT;
*/

-- =============================================================================
-- SUMMARY: Expected Test Results
-- =============================================================================
/*
| Test | Description                          | Expected Result           |
|------|--------------------------------------|---------------------------|
| 1A   | Alpha sees Alpha leads               | 3 rows                    |
| 1B   | Beta sees Beta leads                 | 2 rows                    |
| 2A   | Alpha sees Alpha pipelines           | 1 row                     |
| 2B   | Beta sees Beta pipelines             | 1 row                     |
| 3A   | Alpha sees Alpha proofs              | 1 row                     |
| 3B   | Beta sees Beta proofs                | 1 row                     |
| 4A   | Alpha sees Alpha governance logs     | 1 row                     |
| 4B   | Beta sees Beta governance logs       | 1 row                     |
| 5    | Cross-tenant insert blocked          | RLS violation             |
| 6    | Helper functions return correct vals | tenant_id, role returned  |
| 7    | Governance log update blocked        | 0 rows updated            |
| 8    | No tenant context = no data          | 0 rows                    |
*/

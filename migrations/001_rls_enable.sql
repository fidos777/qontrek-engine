-- Row-Level Security Policies for Multi-Tenant Isolation
-- All tables scoped by brand using app.brand session variable
-- This MUST be applied before any production data access

-- ============================================================
-- ENABLE RLS ON ALL TENANT TABLES
-- ============================================================

-- events_raw
ALTER TABLE IF EXISTS public.events_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events_raw FORCE ROW LEVEL SECURITY;

-- wa_template_log
ALTER TABLE IF EXISTS public.wa_template_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wa_template_log FORCE ROW LEVEL SECURITY;

-- credit_logs
ALTER TABLE IF EXISTS public.credit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_logs FORCE ROW LEVEL SECURITY;

-- referrals
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals FORCE ROW LEVEL SECURITY;

-- yaml_trigger_log
ALTER TABLE IF EXISTS public.yaml_trigger_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.yaml_trigger_log FORCE ROW LEVEL SECURITY;

-- lead_log
ALTER TABLE IF EXISTS public.lead_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_log FORCE ROW LEVEL SECURITY;

-- agent_logs
ALTER TABLE IF EXISTS public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_logs FORCE ROW LEVEL SECURITY;

-- proofs
ALTER TABLE IF EXISTS public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proofs FORCE ROW LEVEL SECURITY;

-- whatsapp_templates
ALTER TABLE IF EXISTS public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_templates FORCE ROW LEVEL SECURITY;

-- ============================================================
-- BRAND ISOLATION POLICIES
-- All policies use current_setting('app.brand', true) for tenant context
-- The 'true' parameter makes it return NULL instead of error if not set
-- ============================================================

-- Policy: events_raw_brand_isolation
DROP POLICY IF EXISTS events_raw_brand_isolation ON public.events_raw;
CREATE POLICY events_raw_brand_isolation ON public.events_raw
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: wa_template_log_brand_isolation
DROP POLICY IF EXISTS wa_template_log_brand_isolation ON public.wa_template_log;
CREATE POLICY wa_template_log_brand_isolation ON public.wa_template_log
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: credit_logs_brand_isolation
DROP POLICY IF EXISTS credit_logs_brand_isolation ON public.credit_logs;
CREATE POLICY credit_logs_brand_isolation ON public.credit_logs
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: referrals_brand_isolation
DROP POLICY IF EXISTS referrals_brand_isolation ON public.referrals;
CREATE POLICY referrals_brand_isolation ON public.referrals
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: yaml_trigger_log_brand_isolation
DROP POLICY IF EXISTS yaml_trigger_log_brand_isolation ON public.yaml_trigger_log;
CREATE POLICY yaml_trigger_log_brand_isolation ON public.yaml_trigger_log
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: lead_log_brand_isolation
DROP POLICY IF EXISTS lead_log_brand_isolation ON public.lead_log;
CREATE POLICY lead_log_brand_isolation ON public.lead_log
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: agent_logs_brand_isolation
DROP POLICY IF EXISTS agent_logs_brand_isolation ON public.agent_logs;
CREATE POLICY agent_logs_brand_isolation ON public.agent_logs
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- Policy: proofs_tenant_isolation
DROP POLICY IF EXISTS proofs_tenant_isolation ON public.proofs;
CREATE POLICY proofs_tenant_isolation ON public.proofs
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)
    OR (current_setting('app.tenant_id', true) IS NULL
        AND current_user = 'service_role'
        AND tenant_id IS NOT NULL)
  );

-- Policy: whatsapp_templates_brand_isolation
DROP POLICY IF EXISTS whatsapp_templates_brand_isolation ON public.whatsapp_templates;
CREATE POLICY whatsapp_templates_brand_isolation ON public.whatsapp_templates
  FOR ALL
  USING (
    brand = current_setting('app.brand', true)
    OR current_setting('app.brand', true) IS NULL
       AND current_user = 'service_role'
  )
  WITH CHECK (
    brand = current_setting('app.brand', true)
    OR (current_setting('app.brand', true) IS NULL
        AND current_user = 'service_role'
        AND brand IS NOT NULL)
  );

-- ============================================================
-- HELPER FUNCTION: Set brand context
-- Must be called before any tenant-scoped query
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_brand_context(p_brand text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_brand IS NULL OR p_brand = '' THEN
    RAISE EXCEPTION 'Brand context cannot be null or empty';
  END IF;

  -- Validate brand exists in brand_config
  IF NOT EXISTS (SELECT 1 FROM public.brand_config WHERE brand = p_brand) THEN
    RAISE EXCEPTION 'Invalid brand: %', p_brand;
  END IF;

  PERFORM set_config('app.brand', p_brand, true);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_brand_context(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_brand_context(text) TO anon;

-- ============================================================
-- HELPER FUNCTION: Set tenant context (for proofs table)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_tenant_context(p_tenant_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
    RAISE EXCEPTION 'Tenant ID cannot be null or empty';
  END IF;

  PERFORM set_config('app.tenant_id', p_tenant_id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_tenant_context(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_tenant_context(text) TO anon;

-- ============================================================
-- VALIDATION FUNCTION: Check RLS is properly configured
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_rls_status()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = c.relname) as policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
      'events_raw', 'wa_template_log', 'credit_logs', 'referrals',
      'yaml_trigger_log', 'lead_log', 'agent_logs', 'proofs',
      'whatsapp_templates', 'ops_logs', 'brand_config'
    )
  ORDER BY c.relname;
$$;

COMMENT ON FUNCTION public.validate_rls_status() IS
  'Returns RLS status for all tenant-scoped tables. Run after migrations to verify.';

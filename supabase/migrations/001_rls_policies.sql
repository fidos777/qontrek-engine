-- =============================================================================
-- Qontrek OS Layer 1 - Multi-Tenant RLS Migration
-- =============================================================================
-- This migration sets up Row-Level Security (RLS) for multi-tenant isolation.
-- Tables: tenants, leads, pipelines, proofs, governance_logs
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: Helper Functions for JWT Extraction
-- =============================================================================

-- Create auth schema if it doesn't exist (Supabase has this by default)
CREATE SCHEMA IF NOT EXISTS auth;

-- Function: auth.tenant_id()
-- Extracts the tenant_id from the JWT claims
-- Falls back to app.tenant_id session variable for service role operations
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    jwt_tenant_id text;
    session_tenant_id text;
BEGIN
    -- Try to get tenant_id from JWT claims first
    jwt_tenant_id := current_setting('request.jwt.claims', true)::json->>'tenant_id';

    IF jwt_tenant_id IS NOT NULL AND jwt_tenant_id != '' THEN
        RETURN jwt_tenant_id::uuid;
    END IF;

    -- Fallback to app.tenant_id session variable (for service role operations)
    session_tenant_id := current_setting('app.tenant_id', true);

    IF session_tenant_id IS NOT NULL AND session_tenant_id != '' THEN
        RETURN session_tenant_id::uuid;
    END IF;

    -- Return NULL if no tenant context is available
    RETURN NULL;
END;
$$;

-- Function: auth.user_role()
-- Extracts the user role from the JWT claims
-- Returns 'anon' if no role is found
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    jwt_role text;
    app_role text;
BEGIN
    -- Try to get role from JWT claims
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';

    IF jwt_role IS NOT NULL AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;

    -- Try app_metadata.role
    jwt_role := current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';

    IF jwt_role IS NOT NULL AND jwt_role != '' THEN
        RETURN jwt_role;
    END IF;

    -- Fallback to app.user_role session variable
    app_role := current_setting('app.user_role', true);

    IF app_role IS NOT NULL AND app_role != '' THEN
        RETURN app_role;
    END IF;

    -- Default to 'anon' if no role found
    RETURN 'anon';
END;
$$;

-- Function: auth.user_id()
-- Extracts the user ID from the JWT (convenience function)
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claim.sub', true),
        (current_setting('request.jwt.claims', true)::json->>'sub')
    )::uuid;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated, anon, service_role;

-- =============================================================================
-- PART 2: Table Definitions (Create if not exists)
-- =============================================================================

-- Table: tenants
-- Master tenant configuration table
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    settings jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: leads
-- Lead/prospect data, isolated per tenant
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    source text DEFAULT 'manual',
    status text DEFAULT 'new',
    lead_quality_score integer DEFAULT 0,
    intent_score integer DEFAULT 0,
    qualification_decision text,
    payment_stage text,
    system_size text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: pipelines
-- Sales/process pipelines, isolated per tenant
CREATE TABLE IF NOT EXISTS public.pipelines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    stages jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: proofs
-- Audit proofs and certifications, isolated per tenant
CREATE TABLE IF NOT EXISTS public.proofs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    sha256 text NOT NULL,
    proof_type text DEFAULT 'generic',
    source_path text,
    recorded_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Table: governance_logs
-- Governance and compliance audit logs, isolated per tenant
CREATE TABLE IF NOT EXISTS public.governance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action text NOT NULL,
    actor_id uuid,
    actor_role text,
    resource_type text,
    resource_id uuid,
    old_value jsonb,
    new_value jsonb,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PART 3: Create Indexes for Performance
-- =============================================================================

-- Indexes for tenant_id lookups (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant_id ON public.pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proofs_tenant_id ON public.proofs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_tenant_id ON public.governance_logs(tenant_id);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON public.leads(qualification_decision);
CREATE INDEX IF NOT EXISTS idx_proofs_sha256 ON public.proofs(sha256);
CREATE INDEX IF NOT EXISTS idx_governance_logs_action ON public.governance_logs(action);
CREATE INDEX IF NOT EXISTS idx_governance_logs_created_at ON public.governance_logs(created_at);

-- =============================================================================
-- PART 4: Enable RLS on All Tables
-- =============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_logs ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (important for security)
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.proofs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.governance_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 5: Drop Existing Policies (Idempotent)
-- =============================================================================

-- Tenants policies
DROP POLICY IF EXISTS "tenants_select_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete_policy" ON public.tenants;

-- Leads policies
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

-- Pipelines policies
DROP POLICY IF EXISTS "pipelines_select_policy" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_insert_policy" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_update_policy" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_delete_policy" ON public.pipelines;

-- Proofs policies
DROP POLICY IF EXISTS "proofs_select_policy" ON public.proofs;
DROP POLICY IF EXISTS "proofs_insert_policy" ON public.proofs;
DROP POLICY IF EXISTS "proofs_update_policy" ON public.proofs;
DROP POLICY IF EXISTS "proofs_delete_policy" ON public.proofs;

-- Governance logs policies
DROP POLICY IF EXISTS "governance_logs_select_policy" ON public.governance_logs;
DROP POLICY IF EXISTS "governance_logs_insert_policy" ON public.governance_logs;
DROP POLICY IF EXISTS "governance_logs_update_policy" ON public.governance_logs;
DROP POLICY IF EXISTS "governance_logs_delete_policy" ON public.governance_logs;

-- =============================================================================
-- PART 6: RLS Policies for TENANTS table
-- =============================================================================
-- Special case: Users can only see their own tenant record
-- Admin roles can manage tenant records

-- SELECT: Users can view their own tenant
CREATE POLICY "tenants_select_policy" ON public.tenants
    FOR SELECT
    USING (
        id = auth.tenant_id()
        OR auth.user_role() IN ('admin', 'super_admin', 'service_role')
    );

-- INSERT: Only super_admin and service_role can create tenants
CREATE POLICY "tenants_insert_policy" ON public.tenants
    FOR INSERT
    WITH CHECK (
        auth.user_role() IN ('super_admin', 'service_role')
    );

-- UPDATE: Admins can update their own tenant, super_admin can update any
CREATE POLICY "tenants_update_policy" ON public.tenants
    FOR UPDATE
    USING (
        (id = auth.tenant_id() AND auth.user_role() = 'admin')
        OR auth.user_role() IN ('super_admin', 'service_role')
    )
    WITH CHECK (
        (id = auth.tenant_id() AND auth.user_role() = 'admin')
        OR auth.user_role() IN ('super_admin', 'service_role')
    );

-- DELETE: Only super_admin and service_role can delete tenants
CREATE POLICY "tenants_delete_policy" ON public.tenants
    FOR DELETE
    USING (
        auth.user_role() IN ('super_admin', 'service_role')
    );

-- =============================================================================
-- PART 7: RLS Policies for LEADS table
-- =============================================================================
-- Leads are strictly isolated by tenant_id

-- SELECT: Users can only view leads from their tenant
CREATE POLICY "leads_select_policy" ON public.leads
    FOR SELECT
    USING (
        tenant_id = auth.tenant_id()
    );

-- INSERT: Users can only insert leads for their tenant
CREATE POLICY "leads_insert_policy" ON public.leads
    FOR INSERT
    WITH CHECK (
        tenant_id = auth.tenant_id()
    );

-- UPDATE: Users can only update leads from their tenant
CREATE POLICY "leads_update_policy" ON public.leads
    FOR UPDATE
    USING (
        tenant_id = auth.tenant_id()
    )
    WITH CHECK (
        tenant_id = auth.tenant_id()
    );

-- DELETE: Users can only delete leads from their tenant (admin/manager only)
CREATE POLICY "leads_delete_policy" ON public.leads
    FOR DELETE
    USING (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    );

-- =============================================================================
-- PART 8: RLS Policies for PIPELINES table
-- =============================================================================
-- Pipelines are strictly isolated by tenant_id

-- SELECT: Users can only view pipelines from their tenant
CREATE POLICY "pipelines_select_policy" ON public.pipelines
    FOR SELECT
    USING (
        tenant_id = auth.tenant_id()
    );

-- INSERT: Only admin/manager can create pipelines for their tenant
CREATE POLICY "pipelines_insert_policy" ON public.pipelines
    FOR INSERT
    WITH CHECK (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    );

-- UPDATE: Only admin/manager can update pipelines for their tenant
CREATE POLICY "pipelines_update_policy" ON public.pipelines
    FOR UPDATE
    USING (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    )
    WITH CHECK (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    );

-- DELETE: Only admin can delete pipelines for their tenant
CREATE POLICY "pipelines_delete_policy" ON public.pipelines
    FOR DELETE
    USING (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'super_admin', 'service_role')
    );

-- =============================================================================
-- PART 9: RLS Policies for PROOFS table
-- =============================================================================
-- Proofs are strictly isolated by tenant_id

-- SELECT: Users can view proofs from their tenant
CREATE POLICY "proofs_select_policy" ON public.proofs
    FOR SELECT
    USING (
        tenant_id = auth.tenant_id()
    );

-- INSERT: Users can create proofs for their tenant
CREATE POLICY "proofs_insert_policy" ON public.proofs
    FOR INSERT
    WITH CHECK (
        tenant_id = auth.tenant_id()
    );

-- UPDATE: Only admin/manager can update proofs (audit trail integrity)
CREATE POLICY "proofs_update_policy" ON public.proofs
    FOR UPDATE
    USING (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    )
    WITH CHECK (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('admin', 'manager', 'super_admin', 'service_role')
    );

-- DELETE: Only super_admin can delete proofs (preserve audit trail)
CREATE POLICY "proofs_delete_policy" ON public.proofs
    FOR DELETE
    USING (
        tenant_id = auth.tenant_id()
        AND auth.user_role() IN ('super_admin', 'service_role')
    );

-- =============================================================================
-- PART 10: RLS Policies for GOVERNANCE_LOGS table
-- =============================================================================
-- Governance logs are append-only for audit purposes

-- SELECT: Users can view logs from their tenant
CREATE POLICY "governance_logs_select_policy" ON public.governance_logs
    FOR SELECT
    USING (
        tenant_id = auth.tenant_id()
    );

-- INSERT: Users can create logs for their tenant
CREATE POLICY "governance_logs_insert_policy" ON public.governance_logs
    FOR INSERT
    WITH CHECK (
        tenant_id = auth.tenant_id()
    );

-- UPDATE: Governance logs are immutable - no updates allowed
CREATE POLICY "governance_logs_update_policy" ON public.governance_logs
    FOR UPDATE
    USING (false)
    WITH CHECK (false);

-- DELETE: Governance logs are immutable - only super_admin for compliance
CREATE POLICY "governance_logs_delete_policy" ON public.governance_logs
    FOR DELETE
    USING (
        auth.user_role() = 'super_admin'
        AND tenant_id = auth.tenant_id()
    );

-- =============================================================================
-- PART 11: Grant Permissions
-- =============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT SELECT, INSERT ON public.governance_logs TO authenticated;

-- Service role gets full access (bypasses RLS when needed)
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.pipelines TO service_role;
GRANT ALL ON public.proofs TO service_role;
GRANT ALL ON public.governance_logs TO service_role;

-- =============================================================================
-- PART 12: Updated_at Trigger Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

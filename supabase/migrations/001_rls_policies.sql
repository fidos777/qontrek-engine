-- =============================================================================
-- Qontrek OS: Multi-tenant RLS Policies
-- Version: 1.0.0
-- Description: Creates tables, helper functions, RLS policies, and indexes
--              for multi-tenant isolation in Supabase
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: HELPER FUNCTIONS
-- These functions extract tenant context from JWT claims or session variables
-- -----------------------------------------------------------------------------

-- Create schema for auth helper functions if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Function: Extract tenant_id from JWT or session variable
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- First, try to get from JWT claim
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    -- Fallback to session variable
    (current_setting('app.tenant_id', true))::uuid
  )
$$;

-- Function: Extract user role from JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- Get from JWT claim
    current_setting('request.jwt.claims', true)::json->>'role',
    -- Fallback to session variable
    current_setting('app.user_role', true)
  )
$$;

-- Function: Extract user_id (sub) from JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    -- Get from JWT 'sub' claim
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    -- Fallback to session variable
    (current_setting('app.user_id', true))::uuid
  )
$$;

-- -----------------------------------------------------------------------------
-- SECTION 2: TABLE DEFINITIONS
-- -----------------------------------------------------------------------------

-- Table: tenants
-- Master tenant registry
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'archived')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table: leads
-- Sales leads with multi-tenant isolation
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  stage text DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  amount numeric(15, 2) DEFAULT 0,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table: pipelines
-- Sales pipeline definitions per tenant
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  stages jsonb DEFAULT '[]'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table: proofs
-- Cryptographic proof chain for audit trail (G13 compliance)
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor jsonb NOT NULL DEFAULT '{}'::jsonb,
  target jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash text NOT NULL,
  previous_hash text,
  proof_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table: governance_logs
-- IMMUTABLE governance event log (no updates or deletes allowed)
CREATE TABLE IF NOT EXISTS governance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gate_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass', 'fail', 'warn', 'pending')),
  evidence jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- -----------------------------------------------------------------------------
-- SECTION 3: ENABLE RLS ON ALL TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- SECTION 4: RLS POLICIES
-- Each tenant can only access their own data
-- -----------------------------------------------------------------------------

-- TENANTS TABLE POLICIES
-- Note: tenants table uses id instead of tenant_id for self-reference
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = auth.tenant_id());

CREATE POLICY "tenants_insert_own" ON tenants
  FOR INSERT
  WITH CHECK (id = auth.tenant_id());

CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE
  USING (id = auth.tenant_id())
  WITH CHECK (id = auth.tenant_id());

CREATE POLICY "tenants_delete_admin" ON tenants
  FOR DELETE
  USING (id = auth.tenant_id() AND auth.user_role() IN ('admin', 'super_admin'));

-- LEADS TABLE POLICIES
CREATE POLICY "leads_select_own" ON leads
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "leads_insert_own" ON leads
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "leads_update_own" ON leads
  FOR UPDATE
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "leads_delete_admin" ON leads
  FOR DELETE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() IN ('admin', 'super_admin'));

-- PIPELINES TABLE POLICIES
CREATE POLICY "pipelines_select_own" ON pipelines
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "pipelines_insert_own" ON pipelines
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "pipelines_update_own" ON pipelines
  FOR UPDATE
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "pipelines_delete_admin" ON pipelines
  FOR DELETE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() IN ('admin', 'super_admin'));

-- PROOFS TABLE POLICIES
CREATE POLICY "proofs_select_own" ON proofs
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "proofs_insert_own" ON proofs
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "proofs_update_own" ON proofs
  FOR UPDATE
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "proofs_delete_admin" ON proofs
  FOR DELETE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() IN ('admin', 'super_admin'));

-- GOVERNANCE_LOGS TABLE POLICIES
-- IMMUTABLE: Only SELECT and INSERT allowed, no UPDATE or DELETE
CREATE POLICY "governance_logs_select_own" ON governance_logs
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "governance_logs_insert_own" ON governance_logs
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- NO UPDATE POLICY - governance_logs are immutable
-- NO DELETE POLICY - governance_logs cannot be deleted

-- -----------------------------------------------------------------------------
-- SECTION 5: PERFORMANCE INDEXES
-- Optimize queries by tenant_id
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON pipelines(tenant_id);

CREATE INDEX IF NOT EXISTS idx_proofs_tenant ON proofs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proofs_event_type ON proofs(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_proofs_created ON proofs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(proof_hash);

CREATE INDEX IF NOT EXISTS idx_governance_logs_tenant ON governance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_gate ON governance_logs(tenant_id, gate_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_status ON governance_logs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_governance_logs_created ON governance_logs(tenant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- SECTION 6: SEED DATA (Demo Tenant)
-- Creates a demo tenant for development/testing
-- -----------------------------------------------------------------------------

-- Insert demo tenant (Voltek Energy)
INSERT INTO tenants (id, name, slug, status, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Voltek Energy',
  'voltek',
  'active',
  '{"industry": "solar_energy", "region": "malaysia", "tier": "enterprise"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Insert demo pipeline
INSERT INTO pipelines (id, tenant_id, name, stages, config)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Solar Installation Pipeline',
  '[
    {"id": "new", "name": "New Lead", "order": 1},
    {"id": "qualified", "name": "Qualified", "order": 2},
    {"id": "proposal", "name": "Proposal Sent", "order": 3},
    {"id": "negotiation", "name": "Negotiation", "order": 4},
    {"id": "closed_won", "name": "Closed Won", "order": 5},
    {"id": "closed_lost", "name": "Closed Lost", "order": 6}
  ]'::jsonb,
  '{"currency": "MYR", "default_probability": {"new": 10, "qualified": 25, "proposal": 50, "negotiation": 75}}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert demo leads
INSERT INTO leads (tenant_id, name, phone, email, stage, amount, data)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Ahmad Razak',
    '+60123456789',
    'ahmad.razak@example.com',
    'negotiation',
    8000.00,
    '{"company": "Razak Solar Sdn Bhd", "source": "referral", "days_in_stage": 21, "next_action": "Follow up on payment plan"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Siti Aminah',
    '+60198765432',
    'siti.aminah@example.com',
    'proposal',
    15000.00,
    '{"company": "Green Home MY", "source": "website", "days_in_stage": 7, "next_action": "Send revised quote"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Muthu Krishnan',
    '+60112233445',
    'muthu.k@example.com',
    'qualified',
    12500.00,
    '{"company": "KL Eco Solutions", "source": "trade_show", "days_in_stage": 3, "next_action": "Schedule site visit"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Lee Wei Ming',
    '+60177889900',
    'weiming.lee@example.com',
    'negotiation',
    22000.00,
    '{"company": "Penang Solar Co", "source": "cold_call", "days_in_stage": 14, "next_action": "Final contract review"}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

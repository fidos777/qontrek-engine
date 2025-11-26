-- Migration: 007_workflow_versions
-- Evolutionary Workflow Engine schema
-- Stores versioned workflow definitions with scoring for evolution

BEGIN;

CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    definition_json JSONB NOT NULL,
    score DECIMAL(10, 4) DEFAULT 0.0,
    parent_version_id UUID REFERENCES public.workflow_versions(id),
    mutation_type TEXT CHECK (mutation_type IN ('clone', 'mutate', 'rollback', 'initial')),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure unique workflow versions per tenant
CREATE UNIQUE INDEX IF NOT EXISTS workflow_versions_tenant_name_version_idx
    ON public.workflow_versions (tenant_id, workflow_name, version);

-- Index for finding active workflows
CREATE INDEX IF NOT EXISTS workflow_versions_tenant_active_idx
    ON public.workflow_versions (tenant_id, workflow_name) WHERE is_active = true;

-- Index for score-based queries (evolution selection)
CREATE INDEX IF NOT EXISTS workflow_versions_score_idx
    ON public.workflow_versions (tenant_id, workflow_name, score DESC);

-- Index for version lineage queries
CREATE INDEX IF NOT EXISTS workflow_versions_parent_idx
    ON public.workflow_versions (parent_version_id);

-- Enable Row Level Security
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

-- RLS policy: tenants can only see their own workflows
CREATE POLICY workflow_versions_tenant_isolation ON public.workflow_versions
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true));

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_versions_updated_at_trigger
    BEFORE UPDATE ON public.workflow_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_versions_updated_at();

COMMIT;

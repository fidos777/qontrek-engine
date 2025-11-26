-- =============================================================================
-- Migration: 007_tenant_ontology.sql
-- Description: Creates tenant_ontology table for storing per-tenant domain
--              ontologies including entities, workflows, and metrics.
-- Version: 1.0.0
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Table: tenant_ontology
-- Stores domain ontology definitions per tenant
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_ontology (
    tenant_id   UUID PRIMARY KEY,
    domain      TEXT NOT NULL DEFAULT 'default',
    entities    JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflows   JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics     JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.tenant_ontology IS 'Stores per-tenant domain ontology definitions including entities, workflows, and metrics';

-- Add column comments
COMMENT ON COLUMN public.tenant_ontology.tenant_id IS 'Unique tenant identifier (UUID)';
COMMENT ON COLUMN public.tenant_ontology.domain IS 'Domain type (e.g., crm, ecommerce, finance)';
COMMENT ON COLUMN public.tenant_ontology.entities IS 'Array of entity definitions with attributes and relationships';
COMMENT ON COLUMN public.tenant_ontology.workflows IS 'Array of workflow definitions with stages and triggers';
COMMENT ON COLUMN public.tenant_ontology.metrics IS 'Array of metric definitions for KPI calculations';
COMMENT ON COLUMN public.tenant_ontology.updated_at IS 'Timestamp of last ontology update';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

-- Index for domain filtering
CREATE INDEX IF NOT EXISTS idx_tenant_ontology_domain
    ON public.tenant_ontology (domain);

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_tenant_ontology_updated_at
    ON public.tenant_ontology (updated_at DESC);

-- GIN index for JSONB entity queries
CREATE INDEX IF NOT EXISTS idx_tenant_ontology_entities_gin
    ON public.tenant_ontology USING GIN (entities);

-- GIN index for JSONB workflow queries
CREATE INDEX IF NOT EXISTS idx_tenant_ontology_workflows_gin
    ON public.tenant_ontology USING GIN (workflows);

-- GIN index for JSONB metric queries
CREATE INDEX IF NOT EXISTS idx_tenant_ontology_metrics_gin
    ON public.tenant_ontology USING GIN (metrics);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Ensures tenants can only access their own ontology data
-- -----------------------------------------------------------------------------

-- Enable RLS on the table
ALTER TABLE public.tenant_ontology ENABLE ROW LEVEL SECURITY;

-- Policy: Allow SELECT only for rows matching the current tenant
-- Uses auth.uid() to get the authenticated user's tenant_id
CREATE POLICY tenant_ontology_select_policy
    ON public.tenant_ontology
    FOR SELECT
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::uuid,
            auth.uid()
        )
    );

-- Policy: Allow INSERT only for the current tenant
CREATE POLICY tenant_ontology_insert_policy
    ON public.tenant_ontology
    FOR INSERT
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::uuid,
            auth.uid()
        )
    );

-- Policy: Allow UPDATE only for rows matching the current tenant
CREATE POLICY tenant_ontology_update_policy
    ON public.tenant_ontology
    FOR UPDATE
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::uuid,
            auth.uid()
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::uuid,
            auth.uid()
        )
    );

-- Policy: Allow DELETE only for rows matching the current tenant
CREATE POLICY tenant_ontology_delete_policy
    ON public.tenant_ontology
    FOR DELETE
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::uuid,
            auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Service Role Bypass Policy
-- Allows service role to access all rows (for admin operations)
-- -----------------------------------------------------------------------------
CREATE POLICY tenant_ontology_service_role_policy
    ON public.tenant_ontology
    FOR ALL
    USING (
        current_setting('role') = 'service_role'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- -----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_update_tenant_ontology_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenant_ontology_timestamp ON public.tenant_ontology;

CREATE TRIGGER update_tenant_ontology_timestamp
    BEFORE UPDATE ON public.tenant_ontology
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_tenant_ontology_timestamp();

-- -----------------------------------------------------------------------------
-- Validation Function: Validate ontology structure
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_ontology_structure(
    p_entities JSONB,
    p_workflows JSONB,
    p_metrics JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    entity_record JSONB;
    workflow_record JSONB;
    metric_record JSONB;
BEGIN
    -- Validate entities array
    IF jsonb_typeof(p_entities) != 'array' THEN
        RAISE EXCEPTION 'entities must be a JSON array';
    END IF;

    FOR entity_record IN SELECT * FROM jsonb_array_elements(p_entities)
    LOOP
        IF entity_record->>'id' IS NULL OR entity_record->>'name' IS NULL THEN
            RAISE EXCEPTION 'Each entity must have id and name fields';
        END IF;
    END LOOP;

    -- Validate workflows array
    IF jsonb_typeof(p_workflows) != 'array' THEN
        RAISE EXCEPTION 'workflows must be a JSON array';
    END IF;

    FOR workflow_record IN SELECT * FROM jsonb_array_elements(p_workflows)
    LOOP
        IF workflow_record->>'id' IS NULL OR workflow_record->>'name' IS NULL THEN
            RAISE EXCEPTION 'Each workflow must have id and name fields';
        END IF;
    END LOOP;

    -- Validate metrics array
    IF jsonb_typeof(p_metrics) != 'array' THEN
        RAISE EXCEPTION 'metrics must be a JSON array';
    END IF;

    FOR metric_record IN SELECT * FROM jsonb_array_elements(p_metrics)
    LOOP
        IF metric_record->>'id' IS NULL OR metric_record->>'name' IS NULL THEN
            RAISE EXCEPTION 'Each metric must have id and name fields';
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Trigger: Validate ontology before insert/update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_validate_tenant_ontology()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.validate_ontology_structure(
        NEW.entities,
        NEW.workflows,
        NEW.metrics
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_tenant_ontology ON public.tenant_ontology;

CREATE TRIGGER validate_tenant_ontology
    BEFORE INSERT OR UPDATE ON public.tenant_ontology
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_validate_tenant_ontology();

COMMIT;

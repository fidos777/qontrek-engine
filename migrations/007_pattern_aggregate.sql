-- Migration: 007_pattern_aggregate.sql
-- Purpose: Create cross-tenant pattern aggregation table for meta-learning
--
-- IMPORTANT: This table stores ANONYMIZED pattern aggregates only.
-- No tenant-sensitive data (PII, brand identifiers, customer data) should be stored.
-- Patterns are statistical aggregates that cannot be traced back to individual tenants.

BEGIN;

-- Create pattern_aggregate table for cross-tenant meta-learning
CREATE TABLE IF NOT EXISTS public.pattern_aggregate (
    id SERIAL PRIMARY KEY,
    pattern_key TEXT NOT NULL,
    pattern_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_gate TEXT NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 1,
    confidence_score NUMERIC(5,4) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT pattern_aggregate_pattern_key_check CHECK (pattern_key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
    CONSTRAINT pattern_aggregate_source_gate_check CHECK (source_gate ~ '^G[0-9]{1,2}$'),
    CONSTRAINT pattern_aggregate_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Unique constraint on pattern_key + source_gate combination
CREATE UNIQUE INDEX IF NOT EXISTS pattern_aggregate_key_gate_idx
    ON public.pattern_aggregate (pattern_key, source_gate);

-- Index for pattern lookups
CREATE INDEX IF NOT EXISTS pattern_aggregate_pattern_key_idx
    ON public.pattern_aggregate (pattern_key);

-- Index for gate-specific queries
CREATE INDEX IF NOT EXISTS pattern_aggregate_source_gate_idx
    ON public.pattern_aggregate (source_gate);

-- Index for temporal queries
CREATE INDEX IF NOT EXISTS pattern_aggregate_updated_at_idx
    ON public.pattern_aggregate (updated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pattern_aggregate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS pattern_aggregate_updated_at_trigger ON public.pattern_aggregate;
CREATE TRIGGER pattern_aggregate_updated_at_trigger
    BEFORE UPDATE ON public.pattern_aggregate
    FOR EACH ROW
    EXECUTE FUNCTION update_pattern_aggregate_timestamp();

-- NOTE: No RLS policies on this table - patterns are tenant-agnostic by design.
-- All data stored here must be pre-anonymized before insertion.

-- Add comment for documentation
COMMENT ON TABLE public.pattern_aggregate IS
    'Cross-tenant anonymized pattern aggregates for meta-learning. Contains no PII or tenant-identifiable data.';

COMMENT ON COLUMN public.pattern_aggregate.pattern_key IS
    'Pattern identifier in format category.metric (e.g., conversion.funnel_drop_rate)';

COMMENT ON COLUMN public.pattern_aggregate.pattern_value IS
    'Anonymized statistical aggregate (counts, percentiles, distributions) - no raw values';

COMMENT ON COLUMN public.pattern_aggregate.source_gate IS
    'Gate identifier where pattern was detected (G0-G21)';

COMMENT ON COLUMN public.pattern_aggregate.sample_count IS
    'Number of data points aggregated (minimum threshold for privacy)';

COMMENT ON COLUMN public.pattern_aggregate.confidence_score IS
    'Statistical confidence in the pattern (0.0 to 1.0)';

COMMIT;

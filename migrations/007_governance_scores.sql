-- Migration: 007_governance_scores.sql
-- Description: Creates governance_scores table with RLS for tenant isolation
-- Date: 2025-01-01

-- Create governance_scores table
CREATE TABLE IF NOT EXISTS public.governance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  gate_id TEXT NOT NULL CHECK (gate_id IN ('G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('pass', 'partial', 'pending', 'fail')),
  evidence JSONB DEFAULT '{}',
  kpis JSONB DEFAULT '{}',
  version TEXT DEFAULT 'v2.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one score per tenant per gate
  CONSTRAINT unique_tenant_gate UNIQUE (tenant_id, gate_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_governance_scores_tenant_id
  ON public.governance_scores(tenant_id);

CREATE INDEX IF NOT EXISTS idx_governance_scores_gate_id
  ON public.governance_scores(gate_id);

CREATE INDEX IF NOT EXISTS idx_governance_scores_status
  ON public.governance_scores(status);

CREATE INDEX IF NOT EXISTS idx_governance_scores_updated_at
  ON public.governance_scores(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.governance_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own tenant's scores
CREATE POLICY governance_scores_tenant_isolation ON public.governance_scores
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- RLS Policy: Service role bypasses RLS for admin operations
CREATE POLICY governance_scores_service_role ON public.governance_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_governance_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS governance_scores_updated_at_trigger ON public.governance_scores;
CREATE TRIGGER governance_scores_updated_at_trigger
  BEFORE UPDATE ON public.governance_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_governance_scores_updated_at();

-- Function to upsert governance score
CREATE OR REPLACE FUNCTION public.upsert_governance_score(
  p_tenant_id TEXT,
  p_gate_id TEXT,
  p_score INTEGER,
  p_status TEXT,
  p_evidence JSONB DEFAULT '{}',
  p_kpis JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.governance_scores (tenant_id, gate_id, score, status, evidence, kpis)
  VALUES (p_tenant_id, p_gate_id, p_score, p_status, p_evidence, p_kpis)
  ON CONFLICT (tenant_id, gate_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    status = EXCLUDED.status,
    evidence = EXCLUDED.evidence,
    kpis = EXCLUDED.kpis,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for overall governance summary per tenant
CREATE OR REPLACE VIEW public.vw_governance_summary AS
SELECT
  tenant_id,
  COUNT(*) as total_gates,
  COUNT(*) FILTER (WHERE status = 'pass') as passed,
  COUNT(*) FILTER (WHERE status = 'partial') as partial,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'fail') as failed,
  ROUND(AVG(score)::numeric, 2) as avg_score,
  MIN(updated_at) as oldest_score_at,
  MAX(updated_at) as newest_score_at
FROM public.governance_scores
GROUP BY tenant_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.governance_scores TO authenticated;
GRANT SELECT ON public.vw_governance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_governance_score TO authenticated;

COMMIT;

-- ops_logs table with RLS for operational telemetry
-- Tracks flow execution, latency, and errors per brand

BEGIN;

-- ============================================================
-- CREATE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ops_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    flow text NOT NULL,
    node text NOT NULL,
    status text NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'error', 'failed', 'skipped')),
    request_id text,
    idempotency_key text NOT NULL,
    latency_ms integer DEFAULT 0,
    error_code text,
    error_msg text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary lookup: brand + time range
CREATE INDEX IF NOT EXISTS ops_logs_brand_created_at_idx
    ON public.ops_logs (brand, created_at DESC);

-- Idempotency deduplication
CREATE UNIQUE INDEX IF NOT EXISTS ops_logs_brand_idempotency_idx
    ON public.ops_logs (brand, idempotency_key);

-- Error analysis
CREATE INDEX IF NOT EXISTS ops_logs_status_idx
    ON public.ops_logs (status)
    WHERE status IN ('error', 'failed');

-- Flow performance
CREATE INDEX IF NOT EXISTS ops_logs_flow_node_idx
    ON public.ops_logs (brand, flow, node);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ops_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ops_logs_brand_isolation ON public.ops_logs;
CREATE POLICY ops_logs_brand_isolation ON public.ops_logs
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
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.ops_logs IS
  'Operational telemetry for WhatsApp flows. RLS enforces brand isolation.';

COMMENT ON COLUMN public.ops_logs.brand IS
  'Tenant identifier - must match app.brand session variable';

COMMENT ON COLUMN public.ops_logs.flow IS
  'Flow name (e.g., survey_pending_alert, formb_helper)';

COMMENT ON COLUMN public.ops_logs.node IS
  'Execution node within flow';

COMMENT ON COLUMN public.ops_logs.idempotency_key IS
  'Unique key for deduplication: lead_id:stage:week:flow';

COMMENT ON COLUMN public.ops_logs.latency_ms IS
  'End-to-end execution time in milliseconds';

COMMIT;

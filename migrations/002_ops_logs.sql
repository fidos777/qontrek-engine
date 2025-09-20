-- Operational log table for WhatsApp runtime
CREATE TABLE IF NOT EXISTS public.ops_logs (
    id bigserial PRIMARY KEY,
    brand text NOT NULL,
    flow text NOT NULL,
    request_id text,
    idempotency_key text,
    status text NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS ops_logs_brand_created_at_idx
    ON public.ops_logs (brand, created_at DESC);

ALTER TABLE IF EXISTS public.ops_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ops_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ops_logs_brand_isolation ON public.ops_logs;
CREATE POLICY ops_logs_brand_isolation
    ON public.ops_logs
    USING (brand = current_setting('app.brand', true))
    WITH CHECK (brand = current_setting('app.brand', true));

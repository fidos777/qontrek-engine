-- Enable row level security for tenant-isolated tables
ALTER TABLE IF EXISTS public.events_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events_raw FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_raw_brand_isolation ON public.events_raw;
CREATE POLICY events_raw_brand_isolation
    ON public.events_raw
    USING (brand = current_setting('app.brand', true))
    WITH CHECK (brand = current_setting('app.brand', true));

ALTER TABLE IF EXISTS public.wa_template_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wa_template_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wa_template_log_brand_isolation ON public.wa_template_log;
CREATE POLICY wa_template_log_brand_isolation
    ON public.wa_template_log
    USING (brand = current_setting('app.brand', true))
    WITH CHECK (brand = current_setting('app.brand', true));

ALTER TABLE IF EXISTS public.credit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_logs_brand_isolation ON public.credit_logs;
CREATE POLICY credit_logs_brand_isolation
    ON public.credit_logs
    USING (brand = current_setting('app.brand', true))
    WITH CHECK (brand = current_setting('app.brand', true));

ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_brand_isolation ON public.referrals;
CREATE POLICY referrals_brand_isolation
    ON public.referrals
    USING (brand = current_setting('app.brand', true))
    WITH CHECK (brand = current_setting('app.brand', true));

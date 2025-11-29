-- Reconciliation view for detecting unmetered WhatsApp sends
-- Respects RLS by filtering on app.brand session variable

-- ============================================================
-- UNMETERED 24H VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.vw_unmetered_24h AS
SELECT
    w.brand,
    w.idempotency_key,
    w.request_id,
    w.template_name,
    w.created_at,
    CASE WHEN c.id IS NULL THEN true ELSE false END AS missing_credit
FROM public.wa_template_log w
LEFT JOIN public.credit_logs c
    ON w.brand = c.brand
    AND w.idempotency_key = c.idempotency_key
WHERE w.status = 'sent'
    AND w.created_at >= now() - INTERVAL '24 hours'
    -- RLS enforcement: only show data for current brand context
    AND w.brand = current_setting('app.brand', true);

COMMENT ON VIEW public.vw_unmetered_24h IS
  'WhatsApp sends in last 24h that lack corresponding credit_logs entry.
   Respects RLS - requires app.brand to be set via set_brand_context().';

-- ============================================================
-- UNMETERED SUMMARY VIEW (for dashboards)
-- ============================================================

CREATE OR REPLACE VIEW public.vw_unmetered_summary AS
SELECT
    brand,
    COUNT(*) AS total_unmetered,
    COUNT(*) FILTER (WHERE missing_credit = true) AS missing_credits,
    MIN(created_at) AS oldest_unmetered,
    MAX(created_at) AS newest_unmetered
FROM public.vw_unmetered_24h
WHERE brand = current_setting('app.brand', true)
GROUP BY brand;

COMMENT ON VIEW public.vw_unmetered_summary IS
  'Aggregated unmetered send statistics per brand. RLS enforced.';

-- ============================================================
-- CREDIT MATCH RATE VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.vw_credit_match_rate AS
SELECT
    w.brand,
    DATE(w.created_at) AS send_date,
    COUNT(*) AS total_sends,
    COUNT(c.id) AS matched_credits,
    ROUND(
        COUNT(c.id)::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    ) AS match_rate_pct
FROM public.wa_template_log w
LEFT JOIN public.credit_logs c
    ON w.brand = c.brand
    AND w.idempotency_key = c.idempotency_key
WHERE w.status = 'sent'
    AND w.created_at >= now() - INTERVAL '7 days'
    AND w.brand = current_setting('app.brand', true)
GROUP BY w.brand, DATE(w.created_at)
ORDER BY send_date DESC;

COMMENT ON VIEW public.vw_credit_match_rate IS
  'Daily credit matching rate for last 7 days. RLS enforced.';

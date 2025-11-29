-- Ops alerts view for error aggregation and monitoring
-- Respects RLS by filtering on app.brand session variable

-- ============================================================
-- OPS ALERTS VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.ops_alerts AS
SELECT
    brand,
    flow,
    node,
    COUNT(*) AS event_count,
    ROUND(AVG(latency_ms)::numeric, 2) AS avg_latency_ms,
    MAX(latency_ms) AS max_latency_ms,
    MIN(latency_ms) AS min_latency_ms,
    ARRAY_AGG(DISTINCT error_code) FILTER (WHERE error_code IS NOT NULL) AS error_codes,
    ARRAY_AGG(DISTINCT error_msg) FILTER (WHERE error_msg IS NOT NULL) AS error_messages,
    MIN(created_at) AS first_error_at,
    MAX(created_at) AS last_error_at
FROM public.ops_logs
WHERE created_at >= now() - INTERVAL '1 hour'
    AND status IN ('error', 'failed')
    -- RLS enforcement
    AND brand = current_setting('app.brand', true)
GROUP BY brand, flow, node
HAVING COUNT(*) > 0
ORDER BY event_count DESC;

COMMENT ON VIEW public.ops_alerts IS
  'Aggregated error alerts from ops_logs in last hour.
   Groups by flow/node with error code collection. RLS enforced.';

-- ============================================================
-- OPS LATENCY PERCENTILES VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.vw_ops_latency_percentiles AS
SELECT
    brand,
    flow,
    node,
    COUNT(*) AS total_events,
    ROUND(AVG(latency_ms)::numeric, 2) AS avg_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50_ms,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY latency_ms) AS p90_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_ms,
    MAX(latency_ms) AS max_ms
FROM public.ops_logs
WHERE created_at >= now() - INTERVAL '24 hours'
    AND status IN ('sent', 'delivered')
    AND brand = current_setting('app.brand', true)
GROUP BY brand, flow, node
ORDER BY total_events DESC;

COMMENT ON VIEW public.vw_ops_latency_percentiles IS
  'Latency percentiles (p50, p90, p95, p99) for successful ops in last 24h. RLS enforced.';

-- ============================================================
-- OPS SUCCESS RATE VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.vw_ops_success_rate AS
SELECT
    brand,
    flow,
    DATE(created_at) AS event_date,
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) AS successful,
    COUNT(*) FILTER (WHERE status IN ('error', 'failed')) AS failed,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::numeric
        / NULLIF(COUNT(*), 0) * 100,
        2
    ) AS success_rate_pct
FROM public.ops_logs
WHERE created_at >= now() - INTERVAL '7 days'
    AND brand = current_setting('app.brand', true)
GROUP BY brand, flow, DATE(created_at)
ORDER BY event_date DESC, total_events DESC;

COMMENT ON VIEW public.vw_ops_success_rate IS
  'Daily success rate per flow for last 7 days. RLS enforced.';

-- ============================================================
-- ACTIVE ALERTS FUNCTION (for real-time alerting)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_active_alerts(
    p_threshold_count integer DEFAULT 5,
    p_time_window interval DEFAULT '15 minutes'::interval
)
RETURNS TABLE(
    brand text,
    flow text,
    node text,
    error_count bigint,
    latest_error_code text,
    latest_error_msg text,
    alert_severity text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        o.brand,
        o.flow,
        o.node,
        COUNT(*) AS error_count,
        (ARRAY_AGG(o.error_code ORDER BY o.created_at DESC))[1] AS latest_error_code,
        (ARRAY_AGG(o.error_msg ORDER BY o.created_at DESC))[1] AS latest_error_msg,
        CASE
            WHEN COUNT(*) >= p_threshold_count * 5 THEN 'critical'
            WHEN COUNT(*) >= p_threshold_count * 2 THEN 'warning'
            ELSE 'info'
        END AS alert_severity
    FROM public.ops_logs o
    WHERE o.created_at >= now() - p_time_window
        AND o.status IN ('error', 'failed')
        AND o.brand = current_setting('app.brand', true)
    GROUP BY o.brand, o.flow, o.node
    HAVING COUNT(*) >= p_threshold_count
    ORDER BY error_count DESC;
$$;

COMMENT ON FUNCTION public.get_active_alerts IS
  'Returns active alerts exceeding threshold in time window. RLS enforced via app.brand.';

GRANT EXECUTE ON FUNCTION public.get_active_alerts TO authenticated;

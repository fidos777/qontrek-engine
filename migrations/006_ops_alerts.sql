-- Aggregated operational alerts derived from ops_logs in the last 24 hours
CREATE OR REPLACE VIEW public.ops_alerts AS
SELECT
    brand,
    flow,
    node,
    status,
    COUNT(*) AS event_count,
    COALESCE(AVG(latency_ms), 0)::bigint AS avg_latency_ms,
    MAX(created_at) AS last_seen_at,
    ARRAY(SELECT DISTINCT ec FROM UNNEST(ARRAY_AGG(error_code)) AS ec WHERE ec IS NOT NULL) AS error_codes,
    ARRAY(SELECT DISTINCT em FROM UNNEST(ARRAY_AGG(error_msg)) AS em WHERE em IS NOT NULL) AS error_messages
FROM public.ops_logs
WHERE created_at >= timezone('utc', now()) - INTERVAL '24 hours'
GROUP BY brand, flow, node, status;

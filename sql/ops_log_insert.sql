WITH brand_context AS (
    SELECT set_config('app.brand', '{{$json.brand}}', true)
)
INSERT INTO public.ops_logs (
    brand,
    flow,
    node,
    status,
    request_id,
    idempotency_key,
    latency_ms,
    error_code,
    error_msg,
    metadata
)
VALUES (
    '{{$json.brand}}',
    COALESCE('{{ $json.ops_flow ?? 'flow_b_send_meter' }}', 'flow_b_send_meter'),
    COALESCE('{{ $json.ops_node ?? 'unknown' }}', 'unknown'),
    COALESCE('{{ $json.ops_status ?? 'sent' }}', 'sent'),
    NULLIF('{{ $json.request_id ?? '' }}', ''),
    NULLIF('{{ $json.idempotency_key ?? '' }}', ''),
    COALESCE({{ $json.ops_latency_ms ?? 0 }}, 0),
    NULLIF('{{ $json.ops_error_code ?? '' }}', ''),
    NULLIF('{{ $json.ops_error_msg ?? '' }}', ''),
    '{{JSON.stringify($json.ops_metadata || $json.send_payload || {})}}'::jsonb
)
ON CONFLICT DO NOTHING;

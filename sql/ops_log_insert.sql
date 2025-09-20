INSERT INTO public.ops_logs (
    brand,
    flow,
    request_id,
    idempotency_key,
    status,
    reason,
    metadata
) VALUES (
    '{{$json.brand}}',
    'flow_b_send_meter',
    '{{$json.request_id}}',
    '{{$json.idempotency_key}}',
    '{{$json.ops_status}}',
    NULLIF('{{$json.ops_reason}}', ''),
    '{{JSON.stringify($json.ops_metadata || $json.send_payload || {})}}'::jsonb
)
ON CONFLICT DO NOTHING;

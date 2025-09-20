SELECT
    brand,
    idempotency_key,
    request_id,
    template_name,
    created_at,
    status,
    reversal_reason
FROM public.vw_unmetered_24h
WHERE COALESCE({{brand}}, brand) = brand
ORDER BY created_at DESC;

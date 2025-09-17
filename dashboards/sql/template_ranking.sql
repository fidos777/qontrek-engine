SELECT
    w.brand,
    COALESCE(
        w.payload ->> 'template_name',
        w.payload -> 'template' ->> 'name',
        w.payload ->> 'template'
    ) AS template_name,
    MAX(c.unit_price_rm) AS unit_price_rm,
    COUNT(*) FILTER (WHERE w.status = 'sent') AS send_count
FROM public.wa_template_log w
LEFT JOIN public.credit_logs c
    ON c.brand = w.brand
   AND c.idempotency_key = w.idempotency_key
WHERE w.status = 'sent'
GROUP BY w.brand, template_name
ORDER BY w.brand, unit_price_rm NULLS LAST, template_name;

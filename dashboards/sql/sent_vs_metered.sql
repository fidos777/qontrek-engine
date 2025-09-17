SELECT
    w.brand,
    COUNT(*) FILTER (WHERE w.status = 'sent') AS sent_count,
    COUNT(*) FILTER (WHERE w.status = 'sent'
        AND EXISTS (
            SELECT 1
            FROM public.credit_logs c
            WHERE c.brand = w.brand
              AND c.idempotency_key = w.idempotency_key
        )
    ) AS metered_count,
    COUNT(*) FILTER (WHERE w.status = 'sent'
        AND NOT EXISTS (
            SELECT 1
            FROM public.credit_logs c
            WHERE c.brand = w.brand
              AND c.idempotency_key = w.idempotency_key
        )
    ) AS unmetered_count
FROM public.wa_template_log w
GROUP BY w.brand
ORDER BY w.brand;

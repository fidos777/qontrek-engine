WITH sent_templates AS (
    SELECT
        w.brand,
        COALESCE(
            w.payload ->> 'template_name',
            w.payload -> 'template' ->> 'name',
            w.template_name
        ) AS template_name,
        w.idempotency_key
    FROM public.wa_template_log AS w
    WHERE w.status = 'sent'
      AND COALESCE({{brand}}, w.brand) = w.brand
)
SELECT
    s.brand,
    s.template_name,
    MAX(c.unit_price_rm) AS unit_price_rm,
    COUNT(*) AS send_count
FROM sent_templates AS s
LEFT JOIN public.credit_logs AS c
  ON c.brand = s.brand
 AND c.idempotency_key = s.idempotency_key
GROUP BY s.brand, s.template_name
ORDER BY s.brand, unit_price_rm NULLS LAST, s.template_name;

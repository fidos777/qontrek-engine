WITH filtered_log AS (
    SELECT
        brand,
        idempotency_key,
        status,
        created_at
    FROM public.wa_template_log
    WHERE COALESCE({{brand}}, brand) = brand
)
SELECT
    f.brand,
    SUM(CASE WHEN f.status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
    SUM(
        CASE
            WHEN f.status = 'sent' AND COALESCE(meter_hit.matched, FALSE) THEN 1
            ELSE 0
        END
    ) AS metered_count,
    SUM(
        CASE
            WHEN f.status = 'sent' AND NOT COALESCE(meter_hit.matched, FALSE) THEN 1
            ELSE 0
        END
    ) AS unmetered_count
FROM filtered_log AS f
LEFT JOIN LATERAL (
    SELECT TRUE AS matched
    FROM public.credit_logs AS c
    WHERE c.brand = f.brand
      AND c.idempotency_key = f.idempotency_key
    LIMIT 1
) AS meter_hit ON TRUE
GROUP BY f.brand
ORDER BY f.brand;

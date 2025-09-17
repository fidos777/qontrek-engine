SELECT
    brand,
    COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
    COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
    CASE
        WHEN COUNT(*) FILTER (WHERE status = 'sent') = 0 THEN 1.0
        ELSE ROUND(
            COUNT(*) FILTER (WHERE status = 'accepted')::numeric
            / NULLIF(COUNT(*) FILTER (WHERE status = 'sent'), 0),
            4
        )
    END AS acceptance_ratio
FROM public.wa_template_log
WHERE created_at >= now() - interval '24 hours'
GROUP BY brand
ORDER BY brand;

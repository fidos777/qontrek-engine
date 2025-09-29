WITH event_counts AS (
    SELECT
        brand,
        COUNT(*) AS total_events
    FROM public.events_raw
    WHERE created_at >= timezone('utc', now()) - INTERVAL '24 hours'
      AND COALESCE({{brand}}, brand) = brand
    GROUP BY brand
),
wa_counts AS (
    SELECT
        brand,
        COUNT(*) AS total_templates,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent_count
    FROM public.wa_template_log
    WHERE created_at >= timezone('utc', now()) - INTERVAL '24 hours'
      AND COALESCE({{brand}}, brand) = brand
    GROUP BY brand
)
SELECT
    COALESCE(e.brand, w.brand) AS brand,
    COALESCE(e.total_events, 0) AS events_tracked,
    COALESCE(w.total_templates, 0) AS wa_records,
    COALESCE(w.sent_count, 0) AS sent_ok,
    CASE
        WHEN COALESCE(e.total_events, 0) = COALESCE(w.total_templates, 0) THEN TRUE
        ELSE FALSE
    END AS acceptance_match,
    CASE
        WHEN COALESCE(e.total_events, 0) = 0 THEN 1.0
        ELSE ROUND(
            COALESCE(w.sent_count, 0)::numeric
            / NULLIF(COALESCE(e.total_events, 0), 0),
            4
        )
    END AS sent_ok_ratio
FROM event_counts AS e
FULL OUTER JOIN wa_counts AS w
  ON w.brand = e.brand
ORDER BY brand;

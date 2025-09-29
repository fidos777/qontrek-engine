-- View to select the most affordable template per brand/locale combination
CREATE OR REPLACE VIEW public.vw_templates_by_price AS
SELECT ranked.brand,
       ranked.locale,
       ranked.template_name,
       ranked.unit_price_rm
FROM (
    SELECT wt.brand,
           wt.locale,
           wt.template_name,
           wt.unit_price_rm,
           ROW_NUMBER() OVER (
               PARTITION BY wt.brand, wt.locale
               ORDER BY wt.unit_price_rm ASC, wt.template_name ASC
           ) AS price_rank
    FROM public.whatsapp_templates wt
) AS ranked
WHERE ranked.price_rank = 1;

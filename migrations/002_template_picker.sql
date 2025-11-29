-- View to select the most affordable template per brand/locale combination
-- Updated: Added RLS enforcement via app.brand session variable

-- Drop and recreate to update view definition
DROP VIEW IF EXISTS public.vw_templates_by_price;

CREATE VIEW public.vw_templates_by_price AS
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
    -- RLS enforcement: only include templates for current brand context
    WHERE wt.brand = current_setting('app.brand', true)
) AS ranked
WHERE ranked.price_rank = 1;

COMMENT ON VIEW public.vw_templates_by_price IS
  'Returns the cheapest template per locale for the current brand.
   Requires app.brand to be set via set_brand_context(). RLS enforced.';

-- View exposing template sends in the last 24 hours that have not been metered
CREATE OR REPLACE VIEW public.vw_unmetered_24h AS
SELECT w.brand,
       w.idempotency_key,
       w.request_id,
       w.template_name,
       w.created_at,
       w.status,
       w.reversal_reason
FROM public.wa_template_log AS w
LEFT JOIN public.credit_logs AS c
  ON c.brand = w.brand
 AND c.idempotency_key = w.idempotency_key
WHERE w.status = 'sent'
  AND c.idempotency_key IS NULL
  AND w.created_at >= timezone('utc', now()) - INTERVAL '24 hours';

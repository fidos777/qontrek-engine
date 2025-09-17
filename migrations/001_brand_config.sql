-- Foundation for multi-tenant WhatsApp routing
CREATE TABLE IF NOT EXISTS public.brand_config (
    brand text PRIMARY KEY,
    phone_number_id text NOT NULL,
    whatsapp_api_token text NOT NULL,
    default_locale text NOT NULL DEFAULT 'ms_MY'
);

-- Ensure WhatsApp template logs are scoped by brand
ALTER TABLE IF EXISTS public.wa_template_log
    ADD COLUMN IF NOT EXISTS brand text;

UPDATE public.wa_template_log
SET brand = 'Voltek'
WHERE brand IS NULL;

ALTER TABLE IF EXISTS public.wa_template_log
    ALTER COLUMN brand SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wa_template_log_brand_idempotency_key_idx
    ON public.wa_template_log (brand, idempotency_key);

-- Ensure credit logs are scoped by brand
ALTER TABLE IF EXISTS public.credit_logs
    ADD COLUMN IF NOT EXISTS brand text;

UPDATE public.credit_logs
SET brand = 'Voltek'
WHERE brand IS NULL;

ALTER TABLE IF EXISTS public.credit_logs
    ALTER COLUMN brand SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS credit_logs_brand_idempotency_key_idx
    ON public.credit_logs (brand, idempotency_key);

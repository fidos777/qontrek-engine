-- Brand configuration table for multi-tenant setup
-- This table stores per-brand WhatsApp API credentials and settings
-- NOTE: brand_config itself does NOT have RLS - it's the source of truth for valid brands

BEGIN;

-- ============================================================
-- CREATE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.brand_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text UNIQUE NOT NULL,
    phone_number_id text NOT NULL,
    whatsapp_api_token text NOT NULL,
    business_account_id text,
    webhook_verify_token text,
    display_name text,
    locale text DEFAULT 'en',
    timezone text DEFAULT 'Asia/Kuala_Lumpur',
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS brand_config_is_active_idx
    ON public.brand_config (is_active)
    WHERE is_active = true;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert sample tenants (safe to re-run with ON CONFLICT)
INSERT INTO public.brand_config (brand, phone_number_id, whatsapp_api_token, display_name)
VALUES
    ('Voltek', 'VOLTEK_PHONE_ID_PLACEHOLDER', 'VOLTEK_TOKEN_PLACEHOLDER', 'Voltek Solar'),
    ('Perodua', 'PERODUA_PHONE_ID_PLACEHOLDER', 'PERODUA_TOKEN_PLACEHOLDER', 'Perodua Motors')
ON CONFLICT (brand) DO NOTHING;

-- ============================================================
-- TRIGGER: Updated timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_brand_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brand_config_update_timestamp ON public.brand_config;
CREATE TRIGGER brand_config_update_timestamp
    BEFORE UPDATE ON public.brand_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_brand_config_timestamp();

-- ============================================================
-- HELPER FUNCTION: Get brand credentials
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_brand_credentials(p_brand text)
RETURNS TABLE(
    phone_number_id text,
    whatsapp_api_token text,
    business_account_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        bc.phone_number_id,
        bc.whatsapp_api_token,
        bc.business_account_id
    FROM public.brand_config bc
    WHERE bc.brand = p_brand
        AND bc.is_active = true
    LIMIT 1;
$$;

-- Only service role can call this (credentials are sensitive)
REVOKE EXECUTE ON FUNCTION public.get_brand_credentials FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_brand_credentials TO service_role;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.brand_config IS
  'Multi-tenant brand configuration. Contains WhatsApp API credentials per brand.
   This table is the source of truth for valid brands.';

COMMENT ON COLUMN public.brand_config.brand IS
  'Unique brand identifier used as tenant key throughout the system';

COMMENT ON COLUMN public.brand_config.phone_number_id IS
  'WhatsApp Business phone number ID for this brand';

COMMENT ON COLUMN public.brand_config.whatsapp_api_token IS
  'WhatsApp Business API token (should be encrypted in production)';

COMMIT;

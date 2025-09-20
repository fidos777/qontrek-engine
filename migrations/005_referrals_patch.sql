BEGIN;

ALTER TABLE IF EXISTS public.referrals
    ADD COLUMN IF NOT EXISTS reward_cap_month integer DEFAULT 5,
    ADD COLUMN IF NOT EXISTS reward_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS reward_last_update timestamptz DEFAULT now();

UPDATE public.referrals
SET
    reward_cap_month = COALESCE(reward_cap_month, 5),
    reward_status = COALESCE(reward_status, 'pending'),
    reward_last_update = COALESCE(reward_last_update, now());

ALTER TABLE IF EXISTS public.referrals
    ALTER COLUMN reward_cap_month SET DEFAULT 5,
    ALTER COLUMN reward_status SET DEFAULT 'pending',
    ALTER COLUMN reward_last_update SET DEFAULT now();

ALTER TABLE IF EXISTS public.referrals
    DROP CONSTRAINT IF EXISTS referrals_brand_installation_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS referrals_brand_referrer_referred_event_idx
    ON public.referrals (brand, referrer_id, referred_id, event_name);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_brand_idempotency_idx
    ON public.referrals (brand, idempotency_key);

COMMIT;

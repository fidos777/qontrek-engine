-- Helper function to validate E.164 formatted phone numbers
CREATE OR REPLACE FUNCTION public.is_e164(phone text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    IF phone IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN phone ~ '^\+[1-9][0-9]{7,14}$';
END;
$$;

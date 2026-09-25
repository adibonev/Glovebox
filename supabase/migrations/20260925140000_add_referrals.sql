-- Invites: every User gets an Invite Code to send to friends, and a new account remembers who
-- invited it. Nothing is rewarded yet; this is the record a reward can later be built on.
-- Additive and re-runnable.

-- Six characters from an alphabet with no 0, O, 1, I or L. The App Store drops the link on the
-- way to the app, so on an iPhone the code is read off one screen and typed into another, and
-- those five are the ones that get mistaken for each other. Mirrors normalizeReferralCode() in
-- packages/core/src/referral.ts.
CREATE OR REPLACE FUNCTION public.new_referral_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  code text;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by integer REFERENCES public.users(id) ON DELETE SET NULL;

-- Existing Users get their code now; new ones get it on insert.
UPDATE public.users SET referral_code = public.new_referral_code() WHERE referral_code IS NULL;
ALTER TABLE public.users ALTER COLUMN referral_code SET DEFAULT public.new_referral_code();
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key ON public.users (referral_code);

-- Record who invited the signed-in User. Only once, never for oneself, and only for an account
-- younger than 30 days: an invite is how someone arrives, not a label to attach later.
CREATE OR REPLACE FUNCTION public.claim_referral(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me integer;
  inviter integer;
BEGIN
  SELECT id INTO me FROM public.users WHERE auth_user_id = auth.uid();
  IF me IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO inviter FROM public.users WHERE referral_code = upper(trim(code));
  IF inviter IS NULL OR inviter = me THEN
    RETURN false;
  END IF;

  UPDATE public.users
     SET referred_by = inviter
   WHERE id = me
     AND referred_by IS NULL
     AND created_at > now() - interval '30 days';
  RETURN FOUND;
END;
$$;

-- How many Users the signed-in User has invited. Nobody can read other people's rows, so the
-- count is worked out here rather than by the app.
CREATE OR REPLACE FUNCTION public.referral_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
    FROM public.users
   WHERE referred_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.claim_referral(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.referral_count() TO authenticated;

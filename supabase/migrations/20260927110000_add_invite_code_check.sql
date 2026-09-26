-- Whether an Invite Code belongs to someone, asked at sign-up so that six characters nobody was
-- ever given are refused on the spot, instead of being accepted and dropped without a word once
-- the account exists (claim_referral only answers after sign-in).
--
-- Open to visitors (anon): that is who signs up. It answers yes or no and nothing more, and a
-- code is made to be passed around anyway; the worst a guesser gains is someone's invite credit.
CREATE OR REPLACE FUNCTION public.invite_code_exists(code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE referral_code = upper(trim(code)));
$$;

REVOKE ALL ON FUNCTION public.invite_code_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_code_exists(text) TO anon, authenticated;

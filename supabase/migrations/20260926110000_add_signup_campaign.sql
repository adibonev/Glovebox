-- Which campaign a User signed up from: the utm labels of the first tagged link they followed
-- (source, medium, campaign, content, term, landing page, date). Campaign labels only, never a
-- click identifier. Without it an ad can be paid for but not judged. Additive and re-runnable.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_campaign jsonb;

-- Record it for the signed-in User: only once, and only for an account younger than 30 days,
-- the same attribution window as the cookie that carried it.
CREATE OR REPLACE FUNCTION public.claim_campaign(campaign jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF jsonb_typeof(campaign) IS DISTINCT FROM 'object' THEN
    RETURN false;
  END IF;

  UPDATE public.users
     SET signup_campaign = campaign
   WHERE auth_user_id = auth.uid()
     AND signup_campaign IS NULL
     AND created_at > now() - interval '30 days';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_campaign(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_campaign(jsonb) TO authenticated;

-- A push token identifies a DEVICE, not a User — so whoever signs in on that device must be
-- able to claim it.
--
-- The app upserts on the token (it is UNIQUE), which turns into an UPDATE when the device has
-- registered before. The old policy only allowed updating rows you already owned, so after a
-- second account signed in on the same phone the update was refused, the mobile client swallowed
-- the error, and that account silently never received a push again. On a test device the token
-- stayed pinned to the first account that ever signed in.
--
-- USING (true) lets the update reach any row; WITH CHECK forces the result to belong to the
-- caller, so the only thing anyone can do is claim a token for themselves. They still cannot
-- read other people's rows (the SELECT policy is unchanged), cannot hand a token to a third
-- party, and would have to already know a token string to bother.

DROP POLICY IF EXISTS "Users update own push tokens" ON public.push_tokens;

CREATE POLICY "Users claim push tokens" ON public.push_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

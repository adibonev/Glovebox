-- Push tokens: Expo push-notification tokens per device, so the reminder cron can send
-- a push (in addition to email) to a User's mobile app. Push goes to ANY app user who
-- registered a token + granted permission (not a Pro-only perk). Additive migration.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT   NOT NULL UNIQUE,
  platform    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Owner manages only their own tokens (DROP-then-CREATE keeps the migration re-runnable).
DROP POLICY IF EXISTS "Users select own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users insert own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users update own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users delete own push tokens" ON public.push_tokens;

CREATE POLICY "Users select own push tokens" ON public.push_tokens
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users insert own push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users update own push tokens" ON public.push_tokens
  FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users delete own push tokens" ON public.push_tokens
  FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- The reminder cron reads tokens via the service-role key (bypasses RLS).

-- Subscriptions & entitlement resolution (ADR-0003). Additive + idempotent.
-- One row per User holds the active Plan (resolved server-side from Stripe / RevenueCat
-- webhooks). Clients read the Plan via RLS and gate on packages/core's entitlements.
-- Writes happen with the service-role key (webhooks) only — no user write policy.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id                BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'pro', 'legacy')),
  status                 TEXT,                              -- raw provider status (e.g. Stripe)
  billing_period         TEXT CHECK (billing_period IN ('monthly', 'annual')),
  billing_channel        TEXT CHECK (billing_channel IN ('web', 'app_store', 'play_store')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  current_period_end     TIMESTAMPTZ,
  trial_end              TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions (stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription"  ON public.subscriptions;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON public.subscriptions;

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Admins view all subscriptions" ON public.subscriptions
  FOR SELECT USING (public.is_admin());

-- Grandfather every existing (pre-billing) User onto the Legacy plan: they keep their
-- current capabilities forever. New sign-ups have no row and resolve to Free.
INSERT INTO public.subscriptions (user_id, plan)
SELECT id, 'legacy' FROM public.users
ON CONFLICT (user_id) DO NOTHING;

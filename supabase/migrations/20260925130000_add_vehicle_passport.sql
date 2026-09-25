-- Vehicle Passport: where each Mileage Reading came from, and public links to a passport.
-- Additive and re-runnable.

-- 1. The source of a Mileage Reading. `certificate`: read off a photographed Roadworthiness
--    Inspection certificate and saved as read. `manual`: typed in, or a read number the User
--    changed. NULL: recorded before sources were kept, and never guessed afterwards.
ALTER TABLE public.mileage_readings
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.mileage_readings
  DROP CONSTRAINT IF EXISTS mileage_readings_source_check;
ALTER TABLE public.mileage_readings
  ADD CONSTRAINT mileage_readings_source_check CHECK (source IS NULL OR source IN ('certificate', 'manual'));

-- 2. Passport Links. Whoever holds the token can read the passport, so the token is the whole
--    secret: 32 hex characters (122 random bits) minted here, never by a client. Revoking sets
--    revoked_at and the link stops working at once. A stranger's request is resolved on the
--    server with the service role; there is deliberately no anonymous policy.
CREATE TABLE IF NOT EXISTS public.passport_links (
  id            SERIAL PRIMARY KEY,
  car_id        INTEGER NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token         TEXT    NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  include_costs BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_passport_links_car_id ON public.passport_links (car_id);

ALTER TABLE public.passport_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view passport links for own cars"   ON public.passport_links;
DROP POLICY IF EXISTS "Users can create passport links for own cars" ON public.passport_links;
DROP POLICY IF EXISTS "Users can revoke passport links for own cars" ON public.passport_links;

CREATE POLICY "Users can view passport links for own cars" ON public.passport_links
  FOR SELECT USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create passport links for own cars" ON public.passport_links
  FOR INSERT WITH CHECK (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
    AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can revoke passport links for own cars" ON public.passport_links
  FOR UPDATE USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  )
  WITH CHECK (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  );

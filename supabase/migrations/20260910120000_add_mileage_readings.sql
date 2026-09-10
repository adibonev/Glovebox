-- Mileage Readings: the odometer of a Vehicle on a given day. Every scanned Roadworthiness
-- Inspection certificate adds one and none overwrites another, so the distance driven between two
-- Inspections can be worked out. The Inspection Service Record cannot hold this history itself:
-- renewing it moves its Expiry Date in place. Additive and re-runnable.
--
-- One reading per Vehicle per day. Scanning the same certificate twice must not count the same
-- kilometres twice, so the app upserts on (car_id, read_on).

CREATE TABLE IF NOT EXISTS public.mileage_readings (
  id          SERIAL PRIMARY KEY,
  car_id      INTEGER NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  km          INTEGER NOT NULL CHECK (km >= 0),
  read_on     DATE    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (car_id, read_on)
);

CREATE INDEX IF NOT EXISTS idx_mileage_readings_user_id ON public.mileage_readings (user_id);

ALTER TABLE public.mileage_readings ENABLE ROW LEVEL SECURITY;

-- Owner-only, keyed on the car the same way `services` is (DROP-then-CREATE keeps it re-runnable).
DROP POLICY IF EXISTS "Users can view mileage for own cars"   ON public.mileage_readings;
DROP POLICY IF EXISTS "Users can insert mileage for own cars" ON public.mileage_readings;
DROP POLICY IF EXISTS "Users can update mileage for own cars" ON public.mileage_readings;
DROP POLICY IF EXISTS "Users can delete mileage for own cars" ON public.mileage_readings;

CREATE POLICY "Users can view mileage for own cars" ON public.mileage_readings
  FOR SELECT USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert mileage for own cars" ON public.mileage_readings
  FOR INSERT WITH CHECK (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
    AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- The upsert on (car_id, read_on) goes through UPDATE when that day already has a reading.
CREATE POLICY "Users can update mileage for own cars" ON public.mileage_readings
  FOR UPDATE USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  )
  WITH CHECK (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
    AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete mileage for own cars" ON public.mileage_readings
  FOR DELETE USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  );

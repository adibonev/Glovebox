-- Renewals: the periods a Service Record covered before it was renewed.
--
-- Renewing moves services.expiry_date (and cost) in place, so until now each renewal erased the
-- period before it. The Vehicle passport needs that history ("ГО: до 15.09.2025, 231 €; до
-- 15.09.2026, 245 €"), and it has to be kept whichever app or screen did the renewal, so a
-- trigger writes it rather than any one client. Additive and re-runnable.
--
-- What counts as a renewal: the Expiry Date moving *later*, on an obligation (not a Repair,
-- which is a dated expense), when the old date was already close (within 90 days) or past.
-- Moving a date that is still far off is a correction, not a renewal, and so is any edit within
-- a day of the Service Record being created.

CREATE TABLE IF NOT EXISTS public.renewals (
  id                   SERIAL PRIMARY KEY,
  -- The history belongs to the car. Deleting the Service Record ("Вече нямам каско") keeps it.
  service_id           INTEGER REFERENCES public.services(id) ON DELETE SET NULL,
  car_id               INTEGER NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id              INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type         TEXT    NOT NULL,
  previous_expiry_date DATE    NOT NULL,
  previous_cost        NUMERIC(10, 2),
  renewed_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renewals_car_id ON public.renewals (car_id);

ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

-- Read-only for the owner. Only the trigger writes, and it runs as the table owner.
DROP POLICY IF EXISTS "Users can view renewals for own cars" ON public.renewals;
CREATE POLICY "Users can view renewals for own cars" ON public.renewals
  FOR SELECT USING (
    car_id IN (SELECT c.id FROM public.cars c JOIN public.users u ON c.user_id = u.id WHERE u.auth_user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.record_renewal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.expiry_date IS NOT NULL
     AND NEW.expiry_date IS NOT NULL
     AND NEW.expiry_date > OLD.expiry_date
     AND OLD.service_type <> 'repair'
     AND OLD.expiry_date <= current_date + 90
     AND COALESCE(OLD.created_at, '-infinity'::timestamptz) < now() - interval '1 day'
  THEN
    INSERT INTO public.renewals (service_id, car_id, user_id, service_type, previous_expiry_date, previous_cost)
    VALUES (OLD.id, OLD.car_id, OLD.user_id, OLD.service_type, OLD.expiry_date, OLD.cost);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS services_record_renewal ON public.services;
CREATE TRIGGER services_record_renewal
  AFTER UPDATE OF expiry_date ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.record_renewal();

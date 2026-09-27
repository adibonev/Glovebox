-- The day a Service Record's cost was entered, so "Анализ" counts spending when it was paid and
-- not on the Expiry Date (which put a policy paid in 2026 under 2027 and ran the chart into the
-- future). Nothing to fill in: the database stamps it. Additive and re-runnable.
--
--   * a new record: the day it is added;
--   * its cost changes: the day of the change;
--   * it is renewed (the Expiry Date moves later while the old one was near or past): the day of
--     the renewal, the new period being a new payment. A correction of a far-off date keeps it.
--
-- Days are Sofia days: the database runs in UTC, whose date lags until 03:00 here.

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS cost_date date;

-- Records made before this: the day they were entered is the best there is.
UPDATE public.services
   SET cost_date = (COALESCE(created_at, now()) AT TIME ZONE 'Europe/Sofia')::date
 WHERE cost_date IS NULL;

CREATE OR REPLACE FUNCTION public.stamp_cost_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'Europe/Sofia')::date;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.cost_date := COALESCE(NEW.cost_date, today);
  ELSIF NEW.cost IS DISTINCT FROM OLD.cost
     OR (NEW.expiry_date > OLD.expiry_date AND OLD.expiry_date <= today + 90) THEN
    NEW.cost_date := today;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS services_stamp_cost_date ON public.services;
CREATE TRIGGER services_stamp_cost_date
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.stamp_cost_date();

-- A renewal keeps the period it replaced (20260925120000_add_renewals.sql); now also the day
-- that period's cost was entered, so the Analysis keeps last year's payment on last year's day.
ALTER TABLE public.renewals ADD COLUMN IF NOT EXISTS previous_cost_date date;

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
    INSERT INTO public.renewals (service_id, car_id, user_id, service_type, previous_expiry_date, previous_cost, previous_cost_date)
    VALUES (OLD.id, OLD.car_id, OLD.user_id, OLD.service_type, OLD.expiry_date, OLD.cost, OLD.cost_date);
  END IF;
  RETURN NEW;
END;
$$;

-- Columns on `services` left from the first version, each replaced by something of its own:
--
--   file_url         → Documents (the `documents` table and the Storage bucket)
--   reminder_sent    → `service_logs`, one row per reminder step sent
--   fuel_type        → `cars.fuel_type`: fuel belongs to the Vehicle, not to a Service Record
--   liters, price_per_liter → never used by any screen
--   mileage          → Mileage Readings (`mileage_readings`), which keep history
--
-- No code reads them any more. Only `mileage` still holds anything (3 rows on 2026-09-27), and
-- those kilometres are moved to Mileage Readings first, so nothing entered is lost. Re-runnable:
-- once the columns are gone, the copy is skipped and the drops do nothing.

-- 1. The kilometres on old Service Records become Mileage Readings, dated the day the record
--    was for when that was in the past (a Repair, a Maintenance done), otherwise the day it was
--    entered, since a reading cannot be later than when it was written down. `manual`: typed in.
--    An existing reading for the same car and day wins: readings are history, never overwritten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'mileage'
  ) THEN
    EXECUTE $copy$
      INSERT INTO public.mileage_readings (car_id, user_id, km, read_on, source)
      SELECT DISTINCT ON (s.car_id, day)
             s.car_id,
             c.user_id,
             s.mileage,
             day,
             'manual'
        FROM public.services s
        JOIN public.cars c ON c.id = s.car_id
        CROSS JOIN LATERAL (
          SELECT LEAST(
                   s.expiry_date,
                   (COALESCE(s.created_at, now()) AT TIME ZONE 'Europe/Sofia')::date
                 ) AS day
        ) d
       WHERE s.mileage IS NOT NULL
         AND s.mileage >= 0
         AND day IS NOT NULL
       ORDER BY s.car_id, day, s.mileage DESC
      ON CONFLICT (car_id, read_on) DO NOTHING
    $copy$;
  END IF;
END
$$;

-- 2. The columns themselves.
ALTER TABLE public.services
  DROP COLUMN IF EXISTS file_url,
  DROP COLUMN IF EXISTS reminder_sent,
  DROP COLUMN IF EXISTS fuel_type,
  DROP COLUMN IF EXISTS liters,
  DROP COLUMN IF EXISTS price_per_liter,
  DROP COLUMN IF EXISTS mileage;

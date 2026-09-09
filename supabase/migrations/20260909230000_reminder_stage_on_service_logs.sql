-- One warning per obligation was never enough. A driver told fifteen days ahead that the policy
-- runs out puts it off, and by the time it matters the message is buried — so the app now says it
-- again at two days, at one, and once more after it has lapsed.
--
-- Which means "already sent" is no longer a property of (car, service type, expiry date): the
-- same obligation is announced four times over its run-up, and each of those has to be sent once
-- and only once. The step is now part of the key.
--
-- Existing rows are backfilled as 'window'. That is what they were — the single warning the old
-- job sent — and leaving them null would re-send it to everyone who already had it.

ALTER TABLE public.service_logs ADD COLUMN IF NOT EXISTS stage TEXT;

UPDATE public.service_logs SET stage = 'window' WHERE stage IS NULL;

-- The cron reads the whole log to decide what it still owes; this is the shape it reads it in.
CREATE INDEX IF NOT EXISTS idx_service_logs_dedupe
  ON public.service_logs (car_id, service_type, expiry_date, stage);

-- Registry Check cache on Service Records (physical table `services`, domain Service Record).
-- Lets a Registry Check (rta.government.bg etc.) record its last outcome so the cron rechecks a
-- Vehicle AT MOST once per day instead of on every load (throttle: core shouldRecheck()).
-- Additive + idempotent; nullable (existing rows stay NULL = "never checked"). No wipe.

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_check_status TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_check_source TEXT;

-- Mirror the Check Result status set (UBIQUITOUS_LANGUAGE.md → Check Result).
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_last_check_status_check;
ALTER TABLE public.services ADD CONSTRAINT services_last_check_status_check
  CHECK (last_check_status IS NULL OR last_check_status IN
    ('valid', 'expiring', 'expired', 'unknown'));

-- The cron scans for Service Records due a recheck; index the throttle column.
CREATE INDEX IF NOT EXISTS services_last_checked_at_idx ON public.services (last_checked_at);

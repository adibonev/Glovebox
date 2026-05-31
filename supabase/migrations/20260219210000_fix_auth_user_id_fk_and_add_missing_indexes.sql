-- Fix wrong FK: users.auth_user_id should reference auth.users, not public.users
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_auth_user_id_fkey
  FOREIGN KEY (auth_user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Index on services.service_type (used in every filter/reminder query)
CREATE INDEX IF NOT EXISTS idx_services_service_type
  ON public.services USING btree (service_type);

-- Partial index on users.is_admin (fast admin checks)
CREATE INDEX IF NOT EXISTS idx_users_is_admin
  ON public.users USING btree (is_admin)
  WHERE is_admin = true;

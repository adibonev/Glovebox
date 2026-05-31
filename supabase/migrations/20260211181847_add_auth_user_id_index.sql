ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Index for fast auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);

-- is_admin column for role-based access control
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- FK to Supabase auth.users
ALTER TABLE public.users
  ADD CONSTRAINT users_auth_user_id_fkey
  FOREIGN KEY (auth_user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

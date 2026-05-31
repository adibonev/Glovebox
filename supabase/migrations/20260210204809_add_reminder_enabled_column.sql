ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true;

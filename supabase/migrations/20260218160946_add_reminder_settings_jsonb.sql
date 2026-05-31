ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reminder_settings JSONB DEFAULT '{}';

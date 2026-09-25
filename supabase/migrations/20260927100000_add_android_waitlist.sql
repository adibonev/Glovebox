-- People on Android who asked to be told when the app comes out on Google Play. Written only by
-- the server (service role) from the form on the site; nobody reads it but the operator. Doubles
-- as the list of testers for the closed test Google requires before a first public release.
-- Additive and re-runnable.

CREATE TABLE IF NOT EXISTS public.android_waitlist (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Which page asked ("landing", "invite", …).
  source     TEXT
);

-- RLS on and no policies: invisible and unwritable to every client key.
ALTER TABLE public.android_waitlist ENABLE ROW LEVEL SECURITY;

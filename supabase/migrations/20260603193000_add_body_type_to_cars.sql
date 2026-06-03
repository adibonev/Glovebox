-- Per-Vehicle body type, so each car shows its own silhouette on the dashboard/garage.
-- Nullable (existing cars stay NULL → the app falls back to the sedan silhouette).
-- Additive + idempotent.

ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS body_type TEXT;

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_body_type_check;
ALTER TABLE public.cars ADD CONSTRAINT cars_body_type_check
  CHECK (body_type IS NULL OR body_type IN
    ('hatchback', 'sedan', 'wagon', 'suv', 'coupe', 'pickup'));

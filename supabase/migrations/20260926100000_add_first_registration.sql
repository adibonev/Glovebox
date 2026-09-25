-- The date a Vehicle was first registered: field (B) of the registration certificate, and printed
-- on every Roadworthiness Inspection certificate too. The statutory Inspection schedule runs from
-- it (first by the 3rd anniversary, second by the 5th, yearly after that), so the app can say when
-- the next Inspection is due without a document. Until now the scan read it and threw it away.
-- Additive and re-runnable: existing Vehicles get NULL.

ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS first_registration date;

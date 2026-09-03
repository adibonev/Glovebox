-- A Service Record can carry an official public verification link, read off the QR code printed
-- on the document it came from.
--
-- The Roadworthiness Inspection certificate (Удостоверение за техническа изправност) prints a QR
-- whose payload is a link to the Automobile Administration's own public check for exactly that
-- certificate. The link is not secret and not enumerable: it carries the protocol number plus a
-- verification code, so it only works for someone holding the document.
--
-- We do NOT fetch it. The endpoint behind that page requires a reCAPTCHA token, which is
-- deliberate and which we respect. The link is stored so the User can open the full official
-- record themselves — mileage history across every past inspection, measurements, the issuing
-- station — none of which is printed on the paper we scan.
--
-- Deliberately generic (`check_url`, not `certificate_url`): Civil Liability policies gain the
-- same kind of 2D code under Directive 2021/2118, and they will use this column too.
--
-- Purely additive: existing rows get NULL and nothing reads it unless it is set.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS check_url text;

COMMENT ON COLUMN public.services.check_url IS
  'Official public verification link read from the document''s QR code (e.g. the Automobile Administration check for a Roadworthiness Inspection certificate). Opened by the User; never fetched by us.';

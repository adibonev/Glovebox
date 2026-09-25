/**
 * The public address of the site: what links sent to other people (a Passport Link, an invite)
 * must point at. Production sets NEXT_PUBLIC_SITE_URL; Vercel previews fall back to their own
 * host, and local development to localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

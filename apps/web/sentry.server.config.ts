import * as Sentry from "@sentry/nextjs";

// Monitoring is opt-in: only initialise when a DSN is configured (e.g. in Vercel).
// Without it the build and runtime are untouched.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 100% of transactions while traffic is low; dial this down as the product grows.
    tracesSampleRate: 1,
  });
}

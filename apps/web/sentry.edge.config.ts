import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware, edge routes). Opt-in via DSN, same as the server config.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
  });
}

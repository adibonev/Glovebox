import * as Sentry from "@sentry/nextjs";

// Client-side Sentry. Opt-in via DSN. Error capture itself runs as legitimate interest
// (security / troubleshooting). Session Replay is analytics-adjacent, so it is only enabled
// with the User's consent — the same "gb-analytics-consent" choice as PostHog (lib/consent.ts) —
// and even then only on an error, with all text masked and media blocked (see /privacy).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const replayConsented = (() => {
  try {
    return localStorage.getItem("gb-analytics-consent") === "granted";
  } catch {
    return false;
  }
})();

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: replayConsented ? 1 : 0,
    integrations: replayConsented
      ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })]
      : [],
  });
}

// Instruments client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

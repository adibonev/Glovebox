import * as Sentry from "@sentry/react-native";
import type { ComponentType } from "react";

/**
 * Crash and error reporting (Sentry). Off unless the build carries EXPO_PUBLIC_SENTRY_DSN (an EAS
 * environment variable for the mobile Sentry project), so a build without it sends nothing.
 *
 * Runs without consent, as on the web: telling that the app crashed is a legitimate interest in
 * keeping it working, and no personal data is attached (no IP, no e-mail; only the account id).
 * Readable stack traces also need the @sentry/react-native config plugin and SENTRY_AUTH_TOKEN
 * (docs/MONITORING.md); until then the reports are minified but still arrive.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    environment: __DEV__ ? "development" : "production",
  });
}

/** The root layout (it takes no props), wrapped for error capture when monitoring is on. */
export function withMonitoring(
  Root: ComponentType<Record<string, unknown>>,
): ComponentType<Record<string, unknown>> {
  return DSN ? Sentry.wrap(Root) : Root;
}

/** Tie reports to the account (its id only), or to no one after sign-out. */
export function setMonitoredUser(authUserId: string | null) {
  if (DSN) Sentry.setUser(authUserId ? { id: authUserId } : null);
}

import * as Sentry from "@sentry/nextjs";

/** Loads the right Sentry config per runtime (Node vs Edge). No-op without a DSN. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors thrown in server components / route handlers (Next.js onRequestError hook).
export const onRequestError = Sentry.captureRequestError;

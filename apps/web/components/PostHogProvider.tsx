"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";

// Analytics is opt-in: without a key this provider is a transparent pass-through.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/** Initialises PostHog on the client and exposes it via context. */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!KEY) return;
    posthog.init(KEY, {
      api_host: HOST,
      // Auto-capture pageviews + pageleaves on SPA navigations (no manual tracker needed).
      defaults: "2025-05-24",
      // Only create person profiles for users we identify (logged-in) — leaner + privacy-friendly.
      person_profiles: "identified_only",
      // GDPR: capture nothing and set no tracking cookies until the User consents (below).
      opt_out_capturing_by_default: true,
    });

    // Honour an existing choice, then react to changes from the consent banner live.
    if (getConsent() === "granted") posthog.opt_in_capturing();
    const onConsent = (event: Event) => {
      const value = (event as CustomEvent<Consent>).detail;
      if (value === "granted") posthog.opt_in_capturing();
      else posthog.opt_out_capturing();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!KEY) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

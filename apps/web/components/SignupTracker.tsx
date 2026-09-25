"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

import { trackPixel } from "./MetaPixel";

/**
 * Counts a new account once, for the ad reports. Rendered by the page chrome only for an account
 * made within the last hour, whichever way it was made (e-mail, Google, the confirmation link),
 * and remembered per account so a reload does not count it twice. Both trackers do nothing
 * without the visitor's consent.
 */
export function SignupTracker({ userId }: { userId: string }) {
  useEffect(() => {
    const key = `glovebox.signupTracked.${userId}`;
    // PostHog starts in its provider's effect, which runs after this one: give it a moment. The
    // flag is set only when the event actually goes, so a cancelled timer does not swallow it.
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
      } catch {
        return; // with nowhere to remember it, better to miss one than to count it on every load
      }
      trackPixel("CompleteRegistration");
      if (posthog.__loaded) posthog.capture("signed_up");
    }, 1500);
    return () => clearTimeout(timer);
  }, [userId]);
  return null;
}

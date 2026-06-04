"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

/** Ties analytics events to the logged-in User. Rendered only when analytics is enabled. */
export function PostHogIdentify({ id, email }: { id: string; email: string }) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !id) return;
    posthog.identify(id, { email });
  }, [posthog, id, email]);

  return null;
}

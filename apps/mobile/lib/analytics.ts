import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import PostHog from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./auth";

/**
 * Product analytics (PostHog, EU). Off unless the build carries EXPO_PUBLIC_POSTHOG_KEY, and even
 * then nothing is captured until the User says yes: the app asks once (AnalyticsConsent on the
 * dashboard) and the answer can be changed in Профил. Same rule as the web's cookie banner.
 */
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/** "granted" or "denied" once asked; absent until then. */
const CHOICE = "glovebox.analytics.choice";

export const posthog = KEY
  ? new PostHog(KEY, { host: HOST, defaultOptIn: false, captureAppLifecycleEvents: true })
  : null;

export type AnalyticsChoice = "granted" | "denied";

/** Record the User's answer and start or stop capturing accordingly. */
export async function setAnalyticsChoice(choice: AnalyticsChoice): Promise<void> {
  await AsyncStorage.setItem(CHOICE, choice);
  if (!posthog) return;
  if (choice === "granted") await posthog.optIn();
  else await posthog.optOut();
}

/** The answer so far (null: not asked yet), and a way to change it. Null too when analytics is off. */
export function useAnalyticsChoice() {
  const [choice, setChoice] = useState<AnalyticsChoice | null | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(CHOICE)
      .then((value) => setChoice(value === "granted" || value === "denied" ? value : null))
      .catch(() => setChoice(null));
  }, []);

  const choose = useCallback(async (value: AnalyticsChoice) => {
    setChoice(value);
    await setAnalyticsChoice(value);
  }, []);

  return {
    /** Analytics exists in this build at all. */
    available: posthog !== null,
    /** undefined while reading; null when never asked. */
    choice,
    choose,
  };
}

/**
 * One screen view per route, and the account id (never the e-mail) once signed in, so the same
 * person on the web and in the app is one person. Nothing leaves the phone without consent:
 * PostHog drops these while opted out. Mount once, in the root layout.
 */
export function useAnalyticsTracking() {
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (posthog && pathname) posthog.screen(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!posthog) return;
    if (userId) posthog.identify(userId);
    // Only a real sign-out forgets the person: at launch the session is null for a moment
    // while it loads, and resetting then would make every launch a new visitor.
    else if (previous.current) posthog.reset();
    previous.current = userId;
  }, [userId]);
}

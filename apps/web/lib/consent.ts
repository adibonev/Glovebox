"use client";

/**
 * Analytics consent (GDPR / ePrivacy). Essential cookies (login/session) always run; analytics
 * (PostHog) and Sentry Session Replay only run once the User opts in. The choice is stored
 * client-side and broadcast so the providers can react without a page reload.
 */
export const CONSENT_KEY = "gb-analytics-consent";
export const CONSENT_EVENT = "gb-consent-change";

export type Consent = "granted" | "denied";

/** The User's stored analytics choice, or null if they haven't decided yet. */
export function getConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null; // private mode / storage blocked → treat as undecided (no analytics)
  }
}

/** Persist the choice and notify listeners (PostHog) in the same tab. */
export function setConsent(value: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore — still dispatch so the current session reacts
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}

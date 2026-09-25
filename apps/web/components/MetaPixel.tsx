"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";

/** Set in Vercel once the Pixel exists in Meta Events Manager. Without it nothing loads. */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Meta's standard loader, written out: a queue that fbevents.js drains once it arrives. */
function loadPixel(id: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", id);
}

/**
 * Record a standard event (e.g. "CompleteRegistration"). Loads the Pixel first if it is allowed
 * but not up yet: the event may fire before <MetaPixel /> has run. Nothing without consent.
 */
export function trackPixel(event: string, params?: Record<string, unknown>) {
  if (!PIXEL_ID || getConsent() !== "granted") return;
  loadPixel(PIXEL_ID);
  window.fbq?.("track", event, params);
}

/**
 * The Meta Pixel, for measuring ads: which ad brought a visit, and which visits became accounts.
 * Advertising cookies, so it loads only after the visitor accepts them in the consent banner, and
 * stops sending the moment they withdraw.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!PIXEL_ID) return;
    setConsented(getConsent() === "granted");
    const onConsent = (event: Event) => {
      const value = (event as CustomEvent<Consent>).detail;
      setConsented(value === "granted");
      if (value !== "granted") window.fbq?.("consent", "revoke");
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  // One PageView per page, including navigations inside the app.
  useEffect(() => {
    if (!PIXEL_ID || !consented) return;
    loadPixel(PIXEL_ID);
    window.fbq?.("consent", "grant");
    window.fbq?.("track", "PageView");
  }, [consented, pathname]);

  return null;
}

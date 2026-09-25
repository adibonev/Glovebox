"use client";

import { useEffect, useState } from "react";

import { APP_STORE_URL } from "@/lib/appStore";

const DISMISSED = "glovebox.appPromo.dismissed";

/**
 * A quiet invitation to the phone app, for people who found Glovebox on the web.
 *
 * Shown once and never again after it is closed — the point is to be useful, not to be met on
 * every visit. iOS Safari is left out on purpose: Apple's own smart banner already offers the app
 * at the top of the page there, and two invitations on one screen is noise.
 */
export function AppStorePromo() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return;
    try {
      if (localStorage.getItem(DISMISSED)) return;
    } catch {
      // Private mode: nothing remembered, so it shows again. Better than not showing at all.
    }
    // After the page has been read for a moment, and clear of the cookie bar's own entrance.
    const timer = setTimeout(() => setShown(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!shown) return null;

  const dismiss = () => {
    setShown(false);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Nothing to remember it with; it will simply offer again next time.
    }
  };

  return (
    <div className="fixed bottom-24 right-3 z-30 w-[min(22rem,calc(100vw-1.5rem))] sm:right-4">
      <div className="anim-up rounded-2xl border border-white/10 bg-ink/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-bold text-ivory">
              Glovebox и в телефона
            </p>
            <p className="mt-1 font-body text-[13px] leading-snug text-silver/70">
              Напомнянията идват на екрана, а документите се попълват от снимка.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Затвори"
            className="-mr-1 -mt-1 rounded-lg px-2 py-1 font-body text-muted transition hover:text-ivory"
          >
            ✕
          </button>
        </div>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          aria-label="Свали Glovebox от App Store"
          className="mt-3 inline-block rounded-lg transition hover:opacity-90"
        >
          {/* Apple's own badge, served unaltered as their marketing guidelines require. */}
          <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12 w-auto" />
        </a>
      </div>
    </div>
  );
}

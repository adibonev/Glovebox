"use client";

import { useEffect, useState } from "react";

const APP_STORE_URL = "https://apps.apple.com/bg/app/id6806023587";
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
            <p className="font-display text-[17px] font-semibold text-ivory">
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
          className="mt-3 flex items-center justify-center rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Свали от App Store
        </a>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { APP_STORE_URL } from "@/lib/appStore";

const DISMISSED = "glovebox.appPromo.dismissed";

/**
 * A quiet invitation to the phone app, for signed-in people using Glovebox on the web.
 *
 * A strip in the flow of the page, under the top bar, rather than a card floating over it: the
 * floating card sat on top of the gauge on a desktop screen. Signed-in pages only, because the
 * public pages carry the App Store badge in their own layout. Closed once, gone for good. iOS
 * Safari is left out: Apple's own smart banner already offers the app there.
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
    setShown(true);
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
    <div className="mb-5 flex items-center gap-4 rounded-card border border-white/10 bg-panel px-4 py-3">
      <p className="min-w-0 flex-1 font-body text-[14px] text-silver">
        <span className="font-semibold text-ivory">Glovebox и в телефона.</span> Напомнянията идват
        на екрана, а талонът се попълва от снимка.
      </p>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        aria-label="Свали Glovebox от App Store"
        className="hidden shrink-0 transition hover:opacity-90 sm:block"
      >
        {/* Apple's own badge, served unaltered as their marketing guidelines require. */}
        <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-10 w-auto" />
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Затвори"
        className="shrink-0 rounded-lg px-2 py-1 font-body text-muted transition hover:text-ivory"
      >
        ✕
      </button>
    </div>
  );
}

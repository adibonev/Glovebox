"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getConsent, setConsent, type Consent } from "@/lib/consent";

// Only prompt when analytics is actually enabled; otherwise the app uses just essential
// (login/session) cookies, which are exempt from consent.
const ANALYTICS_ENABLED = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** GDPR consent banner: essential cookies always; analytics only if the User accepts. */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (ANALYTICS_ENABLED && getConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  const choose = (value: Consent) => {
    setConsent(value);
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-panel/95 px-4 py-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
        <p className="font-body text-[13px] leading-relaxed text-muted">
          Ползваме съществени бисквитки за вход и сесия. С твое съгласие добавяме и{" "}
          <strong className="text-silver">аналитични</strong>, за да разбираме как се ползва
          Glovebox и да го подобряваме.{" "}
          <Link href="/privacy" className="text-copper underline">
            Научи повече
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-xl border border-white/15 px-3.5 py-2 font-body text-sm font-semibold text-silver transition hover:border-white/30 hover:text-ivory"
          >
            Само необходимите
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-xl bg-emerald px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Приемам всички
          </button>
        </div>
      </div>
    </div>
  );
}

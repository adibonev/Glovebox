"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "gb-cookie-ack";

/** Lightweight cookie notice. We use only essential (session) cookies, so this informs + links. */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // ignore (private mode etc.)
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-white/10 bg-panel/95 px-4 py-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
      <p className="font-body text-[13px] leading-relaxed text-muted">
        Ползваме само съществени бисквитки за вход и сесия.{" "}
        <Link href="/privacy" className="text-copper underline">
          Научи повече
        </Link>
        .
      </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-xl bg-emerald px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Разбрах
        </button>
      </div>
    </div>
  );
}

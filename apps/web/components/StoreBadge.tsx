"use client";

import { useActionState, useEffect, useState } from "react";

import { joinAndroidWaitlist, type WaitlistState } from "@/app/_lib/waitlist";
import { APP_STORE_URL } from "@/lib/appStore";

/**
 * Where to get the app. Apple's badge, unaltered as their guidelines require; on an Android phone
 * the app is not out yet, so instead of a badge that leads nowhere it asks to be told when it is.
 * Detected after load: the page is prebuilt, so the first paint is always the badge.
 */
export function StoreBadge({ source }: { source: string }) {
  const [android, setAndroid] = useState(false);
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinAndroidWaitlist, {
    done: false,
    error: null,
  });

  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  if (!android) {
    return (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Свали Glovebox от App Store"
        className="inline-block transition hover:opacity-90"
      >
        <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-[50px] w-auto" />
      </a>
    );
  }

  if (state.done) {
    return (
      <p className="font-body text-[14px] text-silver">Записано. Ще ти пишем, когато излезе за Android.</p>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-1.5">
      <input type="hidden" name="source" value={source} />
      <span className="font-body text-[13px] text-muted">Приложението за Android идва скоро.</span>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="имейл"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-lg border border-white/12 bg-ink2 px-3 py-2.5 font-body text-[14px] text-ivory outline-none focus:border-copper/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg border border-white/12 px-3 py-2.5 font-body text-[14px] font-semibold text-ivory transition hover:border-white/30 disabled:opacity-60"
        >
          Пиши ми
        </button>
      </div>
      {state.error && <span className="font-body text-[13px] text-status-expired">{state.error}</span>}
    </form>
  );
}

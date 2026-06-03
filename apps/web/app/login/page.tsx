"use client";

import { useActionState, useEffect, useState } from "react";

import { authenticate, signInWithGoogle, type AuthState } from "./actions";

const initialState: AuthState = {};

type Mode = "signin" | "signup";

function tabClass(active: boolean): string {
  return active
    ? "rounded-lg bg-emerald px-3 py-2 text-ivory transition"
    : "rounded-lg px-3 py-2 text-silver/60 transition hover:text-ivory";
}

const inputClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-mono text-[11px] uppercase tracking-wider text-silver/60";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, pending] = useActionState(authenticate, initialState);
  const isSignup = mode === "signup";
  const [googleError, setGoogleError] = useState(false);

  // Open the right tab when arriving from the landing CTA (/login?mode=signup),
  // and surface a failed Google round-trip (/login?error=google).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    if (params.get("error") === "google") setGoogleError(true);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-copper">
            Glovebox
          </p>
          <h1 className="mt-1.5 font-display text-3xl text-ivory">
            {isSignup ? "Създай акаунт" : "Вход"}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 font-mono text-[11px] uppercase tracking-wider">
          <button type="button" onClick={() => setMode("signin")} className={tabClass(!isSignup)}>
            Вход
          </button>
          <button type="button" onClick={() => setMode("signup")} className={tabClass(isSignup)}>
            Регистрация
          </button>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
        >
          <input type="hidden" name="intent" value={mode} />

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Имейл</span>
            <input name="email" type="email" autoComplete="email" required className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Парола</span>
            <input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 6 : undefined}
              className={inputClass}
            />
          </label>

          {isSignup && (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Потвърди парола</span>
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className={inputClass}
              />
            </label>
          )}

          {state.error && (
            <p className="font-body text-sm text-status-expired">{state.error}</p>
          )}
          {state.message && (
            <p className="font-body text-sm text-status-valid">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
          >
            {pending ? "Момент…" : isSignup ? "Създай акаунт" : "Вход"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">или</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {googleError && (
          <p className="text-center font-body text-sm text-status-expired">
            Входът с Google не успя. Опитай отново.
          </p>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-white/25 hover:bg-white/[0.07]"
          >
            <GoogleG />
            Продължи с Google
          </button>
        </form>

        <p className="text-center font-body text-sm text-silver/55">
          {isSignup ? "Вече имаш акаунт? " : "Нямаш акаунт? "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "signin" : "signup")}
            className="text-copper transition hover:underline"
          >
            {isSignup ? "Влез" : "Регистрирай се"}
          </button>
        </p>
      </div>
    </main>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.46h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.42-4.96 3.42-8.48z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.6-2.8l-3.72-2.9c-1.03.7-2.36 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.74v2.99A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.6 14.28a7.2 7.2 0 0 1 0-4.56V6.73H1.74a12 12 0 0 0 0 10.54l3.86-2.99z" />
      <path fill="#EA4335" d="M12 4.74c1.68 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.2 15.1 0 12 0A12 12 0 0 0 1.74 6.73l3.86 3a7.15 7.15 0 0 1 6.4-4.99z" />
    </svg>
  );
}

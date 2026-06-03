"use client";

import { useActionState, useEffect, useState } from "react";

import { authenticate, type AuthState } from "./actions";

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

  // Open the right tab when arriving from the landing CTA (/login?mode=signup).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") {
      setMode("signup");
    }
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

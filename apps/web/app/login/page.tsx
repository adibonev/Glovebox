"use client";

import { useActionState } from "react";

import { authenticate, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
      </div>

      <form
        action={formAction}
        className="relative flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
      >
        <div className="flex flex-col gap-1 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-copper">
            Glovebox
          </p>
          <h1 className="font-display text-3xl text-ivory">Вход</h1>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-silver/60">
            Имейл
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-silver/60">
            Парола
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
          />
        </label>

        {state.error && (
          <p className="font-body text-sm text-status-expired">{state.error}</p>
        )}
        {state.message && (
          <p className="font-body text-sm text-status-valid">{state.message}</p>
        )}

        <div className="mt-1 flex flex-col gap-2.5">
          <button
            name="intent"
            value="signin"
            type="submit"
            disabled={pending}
            className="rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
          >
            Вход
          </button>
          <button
            name="intent"
            value="signup"
            type="submit"
            disabled={pending}
            className="rounded-xl border border-copper/40 px-4 py-2.5 font-body text-copper transition hover:bg-copper/10 disabled:opacity-60"
          >
            Регистрация
          </button>
        </div>
      </form>
    </main>
  );
}

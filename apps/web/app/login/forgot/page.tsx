"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Wordmark } from "@/components/Wordmark";

import { requestPasswordReset, type ResetState } from "../actions";

const initialState: ResetState = {};

const inputClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

/**
 * Forgotten password: an e-mail with a link to /auth/reset. The login page's "Забравена парола?"
 * brings along whatever address was already typed there (?email=).
 */
export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const typed = new URLSearchParams(window.location.search).get("email");
    if (typed) setEmail(typed);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Glovebox, начало">
            <Wordmark className="text-[28px]" />
          </Link>
          <h1 className="mt-5 font-display text-3xl font-bold text-ivory">Нова парола</h1>
        </div>

        {state.sent ? (
          <div role="status" className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="font-body text-ivory">
              Ако има профил с <span className="font-semibold">{state.sent}</span>, до минута ще
              получиш писмо с линк за нова парола.
            </p>
            <p className="font-body text-sm text-silver/70">
              Линкът важи един час. Не виждаш писмото? Провери папка Спам.
            </p>
          </div>
        ) : (
          <form
            action={formAction}
            className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
          >
            <p className="font-body text-sm text-silver/80">
              Напиши имейла, с който влизаш. Ще ти пратим линк, от който да си сложиш нова парола.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Имейл</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>

            {state.error && <p className="font-body text-sm text-status-expired">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
            >
              {pending ? "Момент…" : "Изпрати линк"}
            </button>
          </form>
        )}

        <Link href="/login" className="text-center font-body text-sm text-copper hover:underline">
          ← Към входа
        </Link>
      </div>
    </main>
  );
}

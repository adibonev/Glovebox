"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { Wordmark } from "@/components/Wordmark";
import { createClient } from "@/lib/supabase/client";

import { authErrorMessage } from "../../_lib/labels";

type Stage = "checking" | "ready" | "invalid" | "done";

const inputClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

type Recovery = { accessToken: string; refreshToken: string } | "failed";
let taken: Recovery | null = null;

/**
 * The session the link carries, read once: the address bar is cleared straight after, and React
 * may run the effect twice (it does in development), which must find the same tokens again.
 */
function takeRecovery(): Recovery {
  if (taken) return taken;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const failed = fragment.get("error_description") ?? query.get("error_description");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  // The tokens are a login: out of the address bar and the history before anything else.
  if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  taken = failed || !accessToken || !refreshToken ? "failed" : { accessToken, refreshToken };
  return taken;
}

/**
 * Where the "Нова парола" e-mail lands, from the website or the app alike.
 *
 * The link was asked for without PKCE (login/actions.ts, lib/passwordReset.ts in the app), so it
 * carries the session in the address fragment. The page reads it, takes it off the address bar at
 * once, and signs in with it; the new password is then set on that session.
 */
export default function ResetPasswordPage() {
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const recovery = takeRecovery();
    if (recovery === "failed") {
      setStage("invalid");
      return;
    }
    void createClient()
      .auth.setSession({ access_token: recovery.accessToken, refresh_token: recovery.refreshToken })
      .then(({ error: sessionError }) => setStage(sessionError ? "invalid" : "ready"));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Паролата трябва да е поне 6 знака.");
    if (password !== confirm) return setError("Паролите не съвпадат.");
    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(authErrorMessage(updateError));
    setStage("done");
  };

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

        {stage === "checking" && (
          <p className="text-center font-body text-silver/70" role="status">
            Проверяваме линка…
          </p>
        )}

        {stage === "invalid" && (
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="font-body text-ivory">Линкът е изтекъл или вече е използван.</p>
            <Link
              href="/login/forgot"
              className="rounded-xl bg-emerald px-4 py-2.5 text-center font-body font-semibold text-ivory transition hover:bg-emerald/90"
            >
              Поискай нов линк
            </Link>
          </div>
        )}

        {stage === "ready" && (
          <form
            onSubmit={(event) => void save(event)}
            className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
          >
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Нова парола</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Повтори паролата</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={inputClass}
              />
            </label>

            {error && <p className="font-body text-sm text-status-expired">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="mt-1 rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
            >
              {saving ? "Момент…" : "Запази паролата"}
            </button>
          </form>
        )}

        {stage === "done" && (
          <div role="status" className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="font-body text-ivory">Паролата е сменена и вече си вътре.</p>
            <p className="font-body text-sm text-silver/70">
              Ползваш приложението на телефона? Влез там с новата парола.
            </p>
            <Link
              href="/"
              className="rounded-xl bg-emerald px-4 py-2.5 text-center font-body font-semibold text-ivory transition hover:bg-emerald/90"
            >
              Към таблото
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

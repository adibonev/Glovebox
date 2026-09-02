import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BILLING_ENABLED, hasPassword, signInProviders } from "@glovebox/core";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import {
  deleteAccount,
  openBillingPortal,
  requestPasswordChange,
  updatePassword,
  updateUserName,
} from "../_lib/actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "../_lib/labels";
import { getPlan } from "../_lib/plan";
import { signOut } from "../login/actions";

const PLAN_LABEL: Record<string, string> = { free: "Безплатен", pro: "Pro", legacy: "Legacy" };

export const metadata = { title: "Glovebox — Акаунт" };

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const cardClass =
  "flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6";
const saveBtn =
  "self-start rounded-xl bg-emerald px-5 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; sent?: string }>;
}) {
  const { saved, error, sent } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const plan = profile ? await getPlan(supabase, profile.id) : "free";

  // A User who only ever signed in with Google has no password to change.
  const providers = signInProviders(user.app_metadata?.providers ?? []);
  const canSetPassword = hasPassword(providers);
  const providerLabel = providers.includes("apple") ? "Apple" : "Google";

  return (
    <Shell email={user.email ?? ""}>
      <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Акаунт</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Настройки
        </h1>

        <div className="mt-6 flex flex-col gap-5">
          {BILLING_ENABLED && (
            <div className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">План</span>
                  <p className="mt-1 font-display text-xl font-semibold text-ivory">
                    Glovebox {PLAN_LABEL[plan] ?? "Безплатен"}
                  </p>
                </div>
                {plan === "pro" ? (
                  <form action={openBillingPortal}>
                    <button className="rounded-xl border border-white/12 px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-copper/50 hover:text-copper">
                      Управление
                    </button>
                  </form>
                ) : plan === "free" ? (
                  <Link
                    href="/paywall"
                    className="rounded-xl bg-emerald px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
                  >
                    Надгради към Pro
                  </Link>
                ) : (
                  <span className="font-body text-[13px] text-status-valid">Възможности завинаги</span>
                )}
              </div>
              {error === "portal" && (
                <p className="font-body text-[13px] text-status-expiring">
                  Порталът за плащане още не е активиран в Stripe.
                </p>
              )}
            </div>
          )}

          <form action={updateUserName} className={cardClass}>
            <Field label="Име">
              <input
                name="name"
                defaultValue={profile?.name ?? ""}
                placeholder="Твоето име"
                className={fieldClass}
              />
            </Field>
            {saved === "name" && <Note ok>Името е запазено.</Note>}
            <button type="submit" className={saveBtn}>
              Запази името
            </button>
          </form>

          {!canSetPassword ? (
            <div className={cardClass}>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">Вход</span>
                <p className="mt-1 font-display text-xl font-semibold text-ivory">
                  Влизаш с {providerLabel}
                </p>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-muted">
                  Профилът ти няма парола — самоличността ти се потвърждава от {providerLabel} при
                  всеки вход. Имейл: {user.email}
                </p>
              </div>
            </div>
          ) : (
          /* Two steps on purpose: a password change needs a code from the User's mailbox,
             so a borrowed logged-in browser is not enough to take the account over. */
          <form action={sent === "code" ? updatePassword : requestPasswordChange} className={cardClass}>
            <Field label="Имейл">
              <input
                value={user.email ?? ""}
                disabled
                className={`${fieldClass} cursor-not-allowed text-muted`}
              />
            </Field>
            <Field label="Нова парола">
              <input
                type="password"
                name="password"
                minLength={6}
                placeholder="Поне 6 символа"
                className={fieldClass}
              />
            </Field>
            {sent === "code" && (
              <Field label="Код от имейла">
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6 цифри"
                  className={fieldClass}
                />
              </Field>
            )}
            {sent === "code" && !error && <Note ok>Изпратихме код на имейла ти.</Note>}
            {saved === "password" && <Note ok>Паролата е сменена.</Note>}
            {error === "password" && <Note>Паролата трябва да е поне 6 символа.</Note>}
            {error === "code" && <Note>Кодът е грешен или изтекъл. Опитай пак.</Note>}
            <button type="submit" className={saveBtn}>
              {sent === "code" ? "Потвърди и смени" : "Изпрати код"}
            </button>
          </form>
          )}

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-5 py-2.5 font-body font-medium text-muted transition hover:border-status-expired/50 hover:text-status-expired"
            >
              Изход от акаунта
            </button>
          </form>

          {/* Right to erasure (GDPR Art. 17) — the same purge the mobile app runs. */}
          <form action={deleteAccount} className={`${cardClass} border-status-expired/25`}>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-status-expired">
                Изтриване на акаунта
              </span>
              <p className="mt-2 font-body text-[13px] leading-relaxed text-muted">
                Изтриваме профила ти и всичко към него — автомобили, услуги, документи и
                напомняния. Действието е окончателно и данните не могат да бъдат възстановени.
              </p>
            </div>
            <Field label={`Напиши „${DELETE_ACCOUNT_CONFIRMATION}“, за да потвърдиш`}>
              <input
                name="confirm"
                required
                autoComplete="off"
                placeholder={DELETE_ACCOUNT_CONFIRMATION}
                className={fieldClass}
              />
            </Field>
            {error === "confirm" && (
              <Note>Напиши „{DELETE_ACCOUNT_CONFIRMATION}“ точно така, за да потвърдиш.</Note>
            )}
            {error === "delete" && <Note>Изтриването не успя. Опитай пак след малко.</Note>}
            <button
              type="submit"
              className="self-start rounded-xl border border-status-expired/50 px-5 py-2.5 font-body font-semibold text-status-expired transition hover:bg-status-expired/10"
            >
              Изтрий акаунта завинаги
            </button>
          </form>
        </div>
      </section>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{label}</span>
      {children}
    </label>
  );
}

function Note({ children, ok }: { children: ReactNode; ok?: boolean }) {
  return (
    <p className={`font-body text-[13px] ${ok ? "text-status-valid" : "text-status-expired"}`}>
      {children}
    </p>
  );
}

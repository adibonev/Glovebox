import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  BILLING_ENABLED,
  SupabaseReferralRepository,
  hasPassword,
  inviteLink,
  signInProviders,
} from "@glovebox/core";

import { CopyLink } from "@/components/CopyLink";
import { Shell } from "@/components/Shell";
import { OPERATOR } from "@/lib/operator";
import { SITE_URL } from "@/lib/site";
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

export const metadata = { title: "Профил · Glovebox" };

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const cardClass = "flex flex-col gap-4 rounded-card border border-white/10 bg-panel p-5 sm:p-6";
const saveBtn =
  "self-start rounded-xl bg-emerald px-5 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90";

/** The website's pages worth reaching from here; /start is the landing page for a signed-in visitor. */
const HELP_LINKS = [
  { label: "Чести въпроси", href: "/start#chzv" },
  { label: "Поверителност", href: "/privacy" },
  { label: "Общи условия", href: "/terms" },
  { label: "За нас", href: "/za-nas" },
];

/**
 * Profile and settings, in the order people look for them: who they are, how they sign in, their
 * reminders, then the rest. Sign-out is an ordinary action and deleting the profile comes last,
 * apart. The app's Профил keeps the same groups in the same order.
 */
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
  const invite = profile ? await loadInvite(supabase, String(profile.id)) : null;

  // A User who only ever signed in with Google has no password to change.
  const providers = signInProviders(user.app_metadata?.providers ?? []);
  const canSetPassword = hasPassword(providers);
  const providerLabel = providers.includes("apple") ? "Apple" : "Google";

  return (
    <Shell email={user.email ?? ""}>
      <section className="mx-auto mt-2 max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Профил</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-ivory">
          Настройки
        </h1>

        <div className="mt-6 flex flex-col gap-8">
          <Group title="Име и имейл">
            <form action={updateUserName} className={cardClass}>
              <Field label="Име">
                <input name="name" defaultValue={profile?.name ?? ""} placeholder="Твоето име" className={fieldClass} />
              </Field>
              <p className="font-body text-sm text-muted">
                Имейл: <span className="text-silver">{user.email}</span>
              </p>
              {saved === "name" && <Note ok>Името е запазено.</Note>}
              <button type="submit" className={saveBtn}>
                Запази името
              </button>
            </form>
          </Group>

          <Group title="Вход и парола">
            {!canSetPassword ? (
              <div className={cardClass}>
                <p className="font-body text-ivory">Влизаш с {providerLabel}.</p>
                <p className="font-body text-sm leading-relaxed text-muted">
                  Профилът ти няма парола: при всеки вход {providerLabel} потвърждава, че си ти.
                </p>
              </div>
            ) : (
              /* Two steps on purpose: a password change needs a code from the User's mailbox,
                 so a borrowed logged-in browser is not enough to take the account over. */
              <form action={sent === "code" ? updatePassword : requestPasswordChange} className={cardClass}>
                <p className="font-body text-sm leading-relaxed text-muted">
                  {sent === "code"
                    ? "Изпратихме код на имейла ти. Въведи го, за да смениш паролата."
                    : "За да смениш паролата, ще ти изпратим код на имейла."}
                </p>
                {/* The new password is asked for with the code: the first step only sends it. */}
                {sent === "code" && (
                  <>
                    <Field label="Нова парола">
                      <input
                        type="password"
                        name="password"
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Поне 6 символа"
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Код от имейла">
                      <input
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="6 цифри"
                        className={fieldClass}
                      />
                    </Field>
                  </>
                )}
                {saved === "password" && <Note ok>Паролата е сменена.</Note>}
                {error === "password" && <Note>Паролата трябва да е поне 6 символа.</Note>}
                {error === "code" &&
                  (sent === "code" ? (
                    <Note>Кодът е грешен или изтекъл. Опитай пак.</Note>
                  ) : (
                    <Note>Кодът не се изпрати. Опитай пак след малко.</Note>
                  ))}
                <button type="submit" className={saveBtn}>
                  {sent === "code" ? "Смени паролата" : "Изпрати код"}
                </button>
              </form>
            )}
          </Group>

          <Group title="Напомняния">
            <LinkRow href="/reminders" label="Кога да ти напомняме" detail="Колко дни преди изтичане, за всеки вид срок" />
          </Group>

          {BILLING_ENABLED && (
            <Group title="План">
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-xl font-bold text-ivory">Glovebox {PLAN_LABEL[plan] ?? "Безплатен"}</p>
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
                  <p className="font-body text-[13px] text-status-expiring">Порталът за плащане още не е активиран в Stripe.</p>
                )}
              </div>
            </Group>
          )}

          {invite && (
            <Group title="Покани приятел">
              <div className={cardClass}>
                <p className="font-body text-sm leading-relaxed text-muted">
                  Прати Glovebox на някого с кола. Връзката води към приложението в App Store, а на компютър към
                  сайта. Ако се регистрира от iPhone, приятелят ти въвежда кода{" "}
                  <span className="font-mono font-bold text-copper">{invite.code}</span>.
                </p>
                <CopyLink url={inviteLink(SITE_URL, invite.code)} />
                <p className="font-body text-[13px] text-silver">
                  {invite.count === 0
                    ? "Още никой не се е регистрирал с твоя код."
                    : invite.count === 1
                      ? "1 човек се регистрира с твоя код."
                      : `${invite.count} души се регистрираха с твоя код.`}
                </p>
              </div>
            </Group>
          )}

          <Group title="Помощ">
            <div className="overflow-hidden rounded-card border border-white/10 bg-panel">
              <a
                href={`mailto:${OPERATOR.email}?subject=Glovebox`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/[0.03]"
              >
                <span className="font-body text-ivory">Пиши ни</span>
                <span className="truncate font-body text-sm text-muted">{OPERATOR.email}</span>
              </a>
              {HELP_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 font-body text-ivory transition hover:bg-white/[0.03]"
                >
                  {link.label}
                  <Chevron />
                </Link>
              ))}
            </div>
          </Group>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-5 py-2.5 font-body font-medium text-silver transition hover:border-white/25 hover:text-ivory"
            >
              Изход
            </button>
          </form>

          {/* Right to erasure (GDPR Art. 17): the same purge the mobile app runs. */}
          <Group title="Изтриване на профила" danger>
            <form action={deleteAccount} className={`${cardClass} border-status-expired/25`}>
              <p className="font-body text-sm leading-relaxed text-muted">
                Изтриваме профила ти и всичко в него: колите, сроковете, документите и напомнянията. Това е
                окончателно и данните не могат да бъдат възстановени.
              </p>
              <Field label={`Напиши „${DELETE_ACCOUNT_CONFIRMATION}“, за да потвърдиш`}>
                <input
                  name="confirm"
                  required
                  autoComplete="off"
                  placeholder={DELETE_ACCOUNT_CONFIRMATION}
                  className={fieldClass}
                />
              </Field>
              {error === "confirm" && <Note>Напиши „{DELETE_ACCOUNT_CONFIRMATION}“ точно така, за да потвърдиш.</Note>}
              {error === "delete" && <Note>Изтриването не успя. Опитай пак след малко.</Note>}
              <button
                type="submit"
                className="self-start rounded-xl border border-status-expired/50 px-5 py-2.5 font-body font-semibold text-status-expired transition hover:bg-status-expired/10"
              >
                Изтрий профила завинаги
              </button>
            </form>
          </Group>
        </div>
      </section>
    </Shell>
  );
}

function Group({ title, danger, children }: { title: string; danger?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className={`font-mono text-[11px] uppercase tracking-[0.18em] ${danger ? "text-status-expired" : "text-dim"}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function LinkRow({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-card border border-white/10 bg-panel px-5 py-4 transition hover:border-white/20"
    >
      <span>
        <span className="block font-body text-ivory">{label}</span>
        <span className="block font-body text-sm text-muted">{detail}</span>
      </span>
      <Chevron />
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-dim"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-sm text-muted">{label}</span>
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

/**
 * The User's Invite Code and how many signed up with it. Null rather than an error while the
 * invites migration is not applied, so the rest of the page still works.
 */
async function loadInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ code: string; count: number } | null> {
  try {
    const repo = new SupabaseReferralRepository(supabase);
    const [code, count] = await Promise.all([repo.codeFor(userId), repo.invitedCount()]);
    return code ? { code, count } : null;
  } catch {
    return null;
  }
}

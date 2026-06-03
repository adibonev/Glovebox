import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { startProCheckout } from "../_lib/actions";

export const metadata = { title: "Glovebox — Надгради към Pro" };

const REASONS: Record<string, string> = {
  vehicle: "Достигна лимита на безплатния план — 1 автомобил.",
  document: "Достигна лимита на безплатния план — 1 документ.",
};

const PRO_FEATURES = [
  "Неограничено автомобили",
  "Неограничено документи",
  "Push + имейл напомняния",
  "Персонализирани срокове (7–90 дни)",
  "Споделяне със семейството (скоро)",
];

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; error?: string }>;
}) {
  const { reason, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Shell email={user.email ?? ""}>
      <section className="anim-up anim-d1 mx-auto mt-4 max-w-xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Glovebox Pro</p>
        <h1 className="mt-3 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Време е за повече
        </h1>
        <p className="mt-3 font-body text-muted">
          {(reason && REASONS[reason]) ?? "Надгради към Pro за пълните възможности."} Pro дава
          неограничено и още — с 14 дни безплатно.
        </p>

        <ul className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5 text-left">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 font-body text-[14px] text-silver/85">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-status-valid" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {error === "soon" && (
          <p className="mt-6 font-body text-sm text-status-expiring">
            Плащанията се финализират — съвсем скоро. 🛠️
          </p>
        )}
        {error === "checkout" && (
          <p className="mt-6 font-body text-sm text-status-expired">
            Нещо се обърка при плащането. Опитай отново.
          </p>
        )}

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <form action={startProCheckout}>
            <input type="hidden" name="period" value="annual" />
            <button className="rounded-2xl bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90 hover:shadow-[0_14px_40px_-12px_rgba(20,80,58,0.9)]">
              Pro · 24.99 €/год
              <span className="ml-2 rounded-full bg-ivory/15 px-2 py-0.5 text-[11px]">−2 мес.</span>
            </button>
          </form>
          <form action={startProCheckout}>
            <input type="hidden" name="period" value="monthly" />
            <button className="rounded-2xl border border-white/12 px-6 py-3 font-body text-[15px] font-semibold text-silver/85 transition hover:border-white/30 hover:text-ivory">
              Pro · 2.99 €/мес
            </button>
          </form>
        </div>

        <p className="mt-4 font-body text-[12px] text-dim">14 дни безплатно · откажи по всяко време</p>
      </section>
    </Shell>
  );
}

"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

/** The plans, shown on the landing page only while billing is switched on. */
export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="plans" className="border-t border-white/[0.06] py-14">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Планове</p>
        <h2 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-bold text-ivory">
          Започни безплатно. Надгради, когато ти трябва.
        </h2>
      </div>

      <div className="mt-7 flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 font-body text-[13px] font-semibold">
          {([["Месечно", false], ["Годишно", true]] as const).map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => setAnnual(value)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition ${
                annual === value ? "bg-emerald text-ivory" : "text-silver/70 hover:text-ivory"
              }`}
            >
              {label}
              {value && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    annual ? "bg-ivory/15 text-ivory" : "bg-copper/20 text-copper"
                  }`}
                >
                  −2 мес.
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl items-start gap-5 sm:grid-cols-2">
        <div className="flex flex-col rounded-card border border-white/10 bg-white/[0.02] p-6">
          <h3 className="font-display text-xl font-bold text-ivory">Free</h3>
          <p className="mt-3 font-brand text-[40px] font-semibold leading-none text-ivory">0 €</p>
          <p className="mt-1.5 font-body text-[13px] text-dim">завинаги</p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <Check>1 автомобил</Check>
            <Check>До 2 услуги</Check>
            <Check>Статуси и имейл напомняния</Check>
            <Check>Документи към услугите</Check>
            <Check>PDF експорт</Check>
          </ul>
          <Link
            href="/login?mode=signup"
            className="mt-6 rounded-lg border border-white/12 px-4 py-2.5 text-center font-body text-sm font-semibold text-ivory transition hover:border-white/30"
          >
            Започни безплатно
          </Link>
        </div>

        <div className="relative flex flex-col rounded-card border border-copper/40 bg-copper/[0.05] p-6">
          <span className="absolute -top-3 left-6 rounded-full bg-copper px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
            14 дни безплатно
          </span>
          <h3 className="font-display text-xl font-bold text-copper">Pro</h3>
          <p className="mt-3 font-brand text-[40px] font-semibold leading-none text-ivory">
            {annual ? "24.99 €" : "2.99 €"}
            <span className="ml-1 font-body text-base font-medium text-muted">
              /{annual ? "год" : "мес"}
            </span>
          </p>
          <p className="mt-1.5 font-body text-[13px] text-dim">
            {annual ? "Около 2 месеца безплатно спрямо месечния." : "Или 24.99 € на година."}
          </p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <Check>Неограничено автомобили</Check>
            <Check>Неограничено услуги</Check>
            <Check>Push и имейл напомняния</Check>
            <Check>Свой срок за напомняне, от 7 до 90 дни</Check>
            <Check>Споделяне със семейството (скоро)</Check>
            <Check>Всичко от Free</Check>
          </ul>
          <Link
            href="/login?mode=signup"
            className="mt-6 rounded-lg bg-emerald px-4 py-2.5 text-center font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Изпробвай Pro
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center font-body text-[12px] text-dim">
        Който е с нас отпреди плановете, запазва всичко, което има, завинаги.
      </p>
    </section>
  );
}

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 font-body text-[14px] text-silver/85">
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-4 w-4 shrink-0 text-status-valid"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {children}
    </li>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import { GaugePanel } from "./GaugePanel";
import { PlateBadge } from "./PlateBadge";
import { Wheel } from "./Wheel";

// A static sample so the hero previews the real product (the same GaugePanel the app uses).
const SAMPLE_GAUGE = {
  days: 8,
  fraction: 8 / 30,
  color: "#E3A93A",
  typeLabel: "Гражданска отговорност",
  dateLabel: "12.06.2026",
};
const SAMPLE_COUNTS = { valid: 4, expiring: 2, expired: 0 };

/** Marketing / preview page shown to visitors who aren't signed in. */
export function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_85%_110%,rgba(196,149,76,0.10),transparent_70%)]" />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <span className="flex items-baseline font-display text-[25px] font-semibold leading-none tracking-tight">
            <span className="text-ivory">Glove</span>
            <span className="flex items-baseline text-copper">
              b
              <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
              x
            </span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 font-body text-sm font-semibold text-silver/85 transition hover:text-ivory"
            >
              Вход
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-emerald px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
            >
              Регистрация
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
          <div className="anim-up anim-d1">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">
              Дигиталната жабка за колата ти
            </p>
            <h1 className="mt-4 font-display text-[clamp(38px,6vw,62px)] font-semibold leading-[1.03] tracking-tight text-ivory">
              Нито един срок не те изненадва.
            </h1>
            <p className="mt-5 max-w-lg font-body text-[17px] leading-relaxed text-muted">
              Glovebox следи Гражданска отговорност, Каско, винетка, технически преглед, данък
              и още — и ти напомня преди да изтекат. По-евтино от една глоба.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login?mode=signup"
                className="rounded-2xl bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90 hover:shadow-[0_14px_40px_-12px_rgba(20,80,58,0.9)]"
              >
                Започни безплатно
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-white/12 px-6 py-3 font-body text-[15px] font-semibold text-silver/85 transition hover:border-white/30 hover:text-ivory"
              >
                Вход
              </Link>
            </div>
            <p className="mt-4 font-body text-[13px] text-dim">
              Безплатно за първата кола · имейл напомняния · без карта
            </p>
          </div>

          {/* Product preview — the real dashboard panel + a car silhouette. */}
          <div className="anim-up anim-d2 relative">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5">
              <div className="relative grid place-items-center overflow-hidden rounded-[18px] bg-[radial-gradient(90%_70%_at_50%_35%,rgba(20,80,58,0.28),transparent_70%)] px-4 pt-4">
                <div className="mb-2 flex w-full items-center justify-between">
                  <span className="font-display text-lg font-semibold text-ivory">BMW 320d</span>
                  <PlateBadge plate="CB 4521 KX" size="sm" />
                </div>
                <img
                  src="/cars/sedan.webp"
                  alt="Преглед на автомобил"
                  draggable={false}
                  className="max-h-[130px] w-auto max-w-[92%] select-none"
                  style={{ filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.5))" }}
                />
              </div>
              <div className="mt-4">
                <GaugePanel urgent={SAMPLE_GAUGE} counts={SAMPLE_COUNTS} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-t border-white/[0.06] py-12 sm:grid-cols-2 lg:grid-cols-4">
          <Feature title="Всичко на едно място">
            Документи, полици и срокове за всяка кола — в дигиталната жабка.
          </Feature>
          <Feature title="Напомняме навреме">
            Имейл преди всеки срок (push скоро). Сам избираш колко дни преди.
          </Feature>
          <Feature title="Статус с един поглед">
            Валидно · изтича · изтекло, плюс циферблат за най-близкия срок.
          </Feature>
          <Feature title="За български шофьори">
            ГО, Каско, винетка, технически преглед, данък МПС, пожарогасител.
          </Feature>
        </section>

        <footer className="flex flex-col items-center gap-1 border-t border-white/[0.06] py-8 text-center">
          <p className="font-body text-[13px] text-dim">
            Glovebox · следи документите и сроковете на автомобила си.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Feature({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-2 h-8 w-8 rounded-lg bg-copper/15 ring-1 ring-copper/30" />
      <h3 className="font-display text-[17px] font-semibold text-ivory">{title}</h3>
      <p className="mt-1.5 font-body text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

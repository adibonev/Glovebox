"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { useState, type ReactNode } from "react";

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

const HEADLINE = ["Нито", "един", "срок", "не", "те", "изненадва."];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const word: Variants = {
  hidden: { opacity: 0, y: "0.6em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** Marketing / preview page shown to visitors who aren't signed in. */
export function Landing() {
  const reduce = useReducedMotion();
  const loop = <T,>(animate: T) => (reduce ? undefined : animate);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Living background — slow breathing glows. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-[20%] left-1/2 h-[72vh] w-[92vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(20,80,58,0.42),transparent)]"
          animate={loop({ opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] })}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-18%] right-[2%] h-[52vh] w-[52vw] rounded-full bg-[radial-gradient(closest-side,rgba(196,149,76,0.15),transparent)]"
          animate={loop({ opacity: [0.4, 0.7, 0.4], x: [0, 34, 0] })}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
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
            <Link href="/login" className="rounded-xl px-4 py-2 font-body text-sm font-semibold text-silver/85 transition hover:text-ivory">
              Вход
            </Link>
            <Link href="/login?mode=signup" className="rounded-xl bg-emerald px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90">
              Регистрация
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.p variants={rise} className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">
              Дигиталната жабка за колата ти
            </motion.p>

            <h1 className="mt-4 flex flex-wrap gap-x-[0.28em] gap-y-1 font-display text-[clamp(38px,6vw,62px)] font-semibold leading-[1.03] tracking-tight">
              {HEADLINE.map((w, i) => (
                <motion.span
                  key={i}
                  variants={word}
                  className={`inline-block ${i === HEADLINE.length - 1 ? "text-copper" : "text-ivory"}`}
                >
                  {w}
                </motion.span>
              ))}
            </h1>

            <motion.p variants={rise} className="mt-5 max-w-lg font-body text-[17px] leading-relaxed text-muted">
              Glovebox следи Гражданска отговорност, Каско, Винетка, Технически преглед, Данък
              и още — и ти напомня преди да изтекат. По-евтино от една глоба.
            </motion.p>

            <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-3">
              <motion.div whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/login?mode=signup"
                  className="inline-block rounded-2xl bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90 hover:shadow-[0_14px_40px_-12px_rgba(20,80,58,0.9)]"
                >
                  Започни безплатно
                </Link>
              </motion.div>
              <Link
                href="/login"
                className="rounded-2xl border border-white/12 px-6 py-3 font-body text-[15px] font-semibold text-silver/85 transition hover:border-white/30 hover:text-ivory"
              >
                Вход
              </Link>
            </motion.div>

            <motion.p variants={rise} className="mt-4 font-body text-[13px] text-dim">
              Безплатно за първата кола · имейл напомняния · без карта
            </motion.p>
          </motion.div>

          {/* Product preview — floats gently, with a periodic light sweep. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <motion.div
              animate={loop({ y: [0, -10, 0] })}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5"
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                animate={loop({ x: ["-80%", "420%"] })}
                transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              />
              <div className="relative grid place-items-center overflow-hidden rounded-[18px] bg-[radial-gradient(90%_70%_at_50%_35%,rgba(20,80,58,0.28),transparent_70%)] px-4 pt-4">
                <div className="mb-2 flex w-full items-center justify-between">
                  <span className="font-display text-lg font-semibold text-ivory">BMW 320d</span>
                  <PlateBadge plate="CB 4521 KX" size="sm" />
                </div>
                <motion.img
                  src="/cars/sedan.webp"
                  alt="Преглед на автомобил"
                  draggable={false}
                  className="max-h-[130px] w-auto max-w-[92%] select-none"
                  style={{ filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.5))" }}
                  animate={loop({ scale: [1, 1.05, 1] })}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="mt-4">
                <GaugePanel urgent={SAMPLE_GAUGE} counts={SAMPLE_COUNTS} />
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 border-t border-white/[0.06] py-12 sm:grid-cols-2 lg:grid-cols-4"
        >
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
            ГО, Каско, Винетка, Технически преглед, Данък МПС, Пожарогасител.
          </Feature>
        </motion.section>

        <Pricing />

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
    <motion.div
      variants={rise}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
    >
      <div className="mb-2 h-8 w-8 rounded-lg bg-copper/15 ring-1 ring-copper/30" />
      <h3 className="font-display text-[17px] font-semibold text-ivory">{title}</h3>
      <p className="mt-1.5 font-body text-[13px] leading-relaxed text-muted">{children}</p>
    </motion.div>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <motion.section
      id="plans"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="border-t border-white/[0.06] py-14"
    >
      <motion.div variants={rise} className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Планове</p>
        <h2 className="mt-2 font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-tight text-ivory">
          Започни безплатно, надгради при нужда
        </h2>
      </motion.div>

      <motion.div variants={rise} className="mt-7 flex justify-center">
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
      </motion.div>

      <div className="mx-auto mt-8 grid max-w-3xl items-start gap-5 sm:grid-cols-2">
        <motion.div variants={rise} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="font-display text-xl font-semibold text-ivory">Free</h3>
          <p className="mt-3 font-display text-[40px] font-semibold leading-none text-ivory">0 €</p>
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
            className="mt-6 rounded-xl border border-white/12 px-4 py-2.5 text-center font-body text-sm font-semibold text-ivory transition hover:border-white/30"
          >
            Започни безплатно
          </Link>
        </motion.div>

        <motion.div
          variants={rise}
          className="relative flex flex-col rounded-2xl border border-copper/40 bg-gradient-to-b from-copper/[0.08] to-transparent p-6 shadow-[0_24px_60px_-28px_rgba(196,149,76,0.55)]"
        >
          <span className="absolute -top-3 left-6 rounded-full bg-copper px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
            14 дни безплатно
          </span>
          <h3 className="font-display text-xl font-semibold text-copper">Pro</h3>
          <p className="mt-3 font-display text-[40px] font-semibold leading-none text-ivory">
            {annual ? "24.99 €" : "2.99 €"}
            <span className="ml-1 font-body text-base font-medium text-muted">
              /{annual ? "год" : "мес"}
            </span>
          </p>
          <p className="mt-1.5 font-body text-[13px] text-dim">
            {annual ? "≈ 2 месеца безплатно спрямо месечния" : "или 24.99 € на година"}
          </p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            <Check>Неограничено автомобили</Check>
            <Check>Неограничено услуги</Check>
            <Check>Push + имейл напомняния</Check>
            <Check>Персонализирани срокове (7–90 дни)</Check>
            <Check>Споделяне със семейството (скоро)</Check>
            <Check>Всичко от Free</Check>
          </ul>
          <Link
            href="/login?mode=signup"
            className="mt-6 rounded-xl bg-emerald px-4 py-2.5 text-center font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Изпробвай Pro
          </Link>
        </motion.div>
      </div>

      <motion.p variants={rise} className="mt-6 text-center font-body text-[12px] text-dim">
        Съществуващите потребители запазват възможностите си завинаги (Legacy).
      </motion.p>
    </motion.section>
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

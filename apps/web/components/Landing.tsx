import { BILLING_ENABLED } from "@glovebox/core";
import Link from "next/link";
import type { ReactNode } from "react";

import { APP_STORE_URL } from "@/lib/appStore";

import { GaugePanel } from "./GaugePanel";
import { FAQ } from "./landing/faq";
import { InspectionCalculator } from "./landing/InspectionCalculator";
import { InspectionCertificate } from "./landing/InspectionCertificate";
import { Pricing } from "./landing/Pricing";
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

/** The fields the app reads off the certificate, numbered as they are marked on it. */
const READ_FIELDS = [
  "Регистрационният номер",
  "Номерът на рамата",
  "Марката и моделът",
  "Километрите в деня на прегледа",
  "До кога е валиден прегледът",
];

/** Every Service Type, and how it gets into the app. */
const TRACKED: { name: string; how: string }[] = [
  {
    name: "Технически преглед",
    how: "Снимаш талона. Километрите се пазят година след година.",
  },
  { name: "Гражданска отговорност", how: "Снимаш полицата. Датата и сумата се попълват." },
  { name: "Каско", how: "Снимаш полицата. Ако нямаш каско, казваш го веднъж." },
  {
    name: "Винетка",
    how: "Казваш коя си купил и кога: уикенд, седмична, месечна, тримесечна или годишна. Датата излиза сама.",
  },
  {
    name: "Данък МПС",
    how: "До 30 април с 5% отстъпка или на две части до 30 юни и 31 октомври. Електрическите коли не плащат.",
  },
  { name: "Пожарогасител", how: "Една дата, от етикета на бутилката." },
  { name: "Обслужване", how: "Датата на следващата смяна на масло или на това, което ти е казал сервизът." },
  { name: "Ремонт", how: "Не изтича. Записваш сумата и виждаш колко ти струва колата за година." },
];

/**
 * Marketing page for visitors who are not signed in.
 *
 * One moving thing only: the gauge fills. The rest holds still, and the middle of the page
 * turns to paper, because that is what the documents in a glovebox are.
 */
export function Landing() {
  return (
    <main className="relative z-[1] min-h-screen">
      <FaqStructuredData />

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <span className="flex items-baseline font-brand text-[25px] font-semibold leading-none tracking-tight">
            <span className="text-ivory">Glove</span>
            <span className="flex items-baseline text-copper">
              b
              <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
              x
            </span>
          </span>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#chzv" className="hidden px-3 py-2 font-body text-sm font-semibold text-silver/85 transition hover:text-ivory sm:block">
              Въпроси
            </a>
            <Link href="/login" className="px-3 py-2 font-body text-sm font-semibold text-silver/85 transition hover:text-ivory">
              Вход
            </Link>
            <Link href="/login?mode=signup" className="rounded-lg bg-emerald px-4 py-2 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90">
              Регистрация
            </Link>
          </nav>
        </header>

        <section className="grid items-center gap-10 pb-20 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">
              Дигиталната жабка за колата ти
            </p>
            <h1 className="mt-4 font-display text-[clamp(44px,6.6vw,72px)] font-extrabold leading-[0.98] text-ivory">
              Нито един срок не те <span className="text-copper">изненадва.</span>
            </h1>
            <p className="mt-5 max-w-lg font-body text-[18px] leading-relaxed text-muted">
              Гражданската, прегледът, винетката, данъкът. Glovebox помни датите вместо теб и ти
              пише, преди да изтекат.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login?mode=signup"
                className="rounded-lg bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
              >
                Започни безплатно
              </Link>
              <AppStoreBadge />
            </div>

            <p className="mt-4 font-body text-[13px] text-dim">
              {BILLING_ENABLED
                ? "Първата кола е безплатна. Без карта."
                : "Безплатно. Без карта. Имейл напомняния, а на iPhone и известия."}
            </p>
          </div>

          <div className="rounded-card border border-white/10 bg-panel p-4 sm:p-5">
            <div className="grid place-items-center px-4 pt-4">
              <div className="mb-2 flex w-full items-center justify-between">
                <span className="font-display text-xl font-bold text-ivory">BMW 320d</span>
                <PlateBadge plate="CB 4521 KX" size="sm" />
              </div>
              <img
                src="/cars/sedan.webp"
                alt=""
                draggable={false}
                className="max-h-[130px] w-auto max-w-[92%] select-none"
                style={{ filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.5))" }}
              />
            </div>
            <div className="mt-4">
              <GaugePanel urgent={SAMPLE_GAUGE} counts={SAMPLE_COUNTS} />
            </div>
          </div>
        </section>
      </div>

      <div className="bg-paper-base text-paper-ink">
        <section id="kak-raboti" className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div>
              <Eyebrow>Как работи</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(38px,5vw,60px)] font-extrabold leading-[0.98]">
                Снимаш талона. Готово.
              </h2>
            </div>
            <div className="lg:pt-8">
              <p className="max-w-lg font-body text-[17px] leading-relaxed text-paper-muted">
                В приложението за iPhone снимаш удостоверението от последния преглед. То прочита
                пет неща от него. Проверяваш ги и запазваш. Снимката се разчита на телефона и не
                се качва никъде.
              </p>
              <ol className="mt-6 max-w-lg divide-y divide-paper-rule border-y border-paper-rule">
                {READ_FIELDS.map((field, i) => (
                  <li key={field} className="flex items-baseline gap-4 py-2.5 font-body text-[15px]">
                    <span className="font-mono text-[12px] font-bold text-paper-copper">{i + 1}</span>
                    {field}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-0">
            <div className="w-full max-w-[640px]">
              <InspectionCertificate />
            </div>
            <figure className="w-[220px] shrink-0 sm:w-[240px] lg:-ml-10 lg:mt-20">
              <img
                src="/screens/avtomobili.webp"
                alt="Екранът „Автомобили“ в приложението: BMW 320d с всичките си срокове и суми"
                width={600}
                height={1300}
                className="w-full rounded-[34px] border-[6px] border-ink shadow-[0_30px_60px_-24px_rgba(7,16,12,0.55)]"
              />
              <figcaption className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-paper-muted">
                Истински екран от приложението
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-t border-paper-rule">
          <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Eyebrow>Какво следи</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(34px,4.4vw,52px)] font-extrabold leading-[1]">
                Седем срока и един разход.
              </h2>
              <p className="mt-5 max-w-sm font-body text-[17px] leading-relaxed text-paper-muted">
                Всеки влиза по своя начин. Никъде не пишеш повече, отколкото трябва.
              </p>
            </div>
            <dl className="divide-y divide-paper-rule border-y border-paper-rule">
              {TRACKED.map(({ name, how }) => (
                <div key={name} className="grid gap-1 py-4 sm:grid-cols-[210px_1fr] sm:gap-6">
                  <dt className="font-display text-[20px] font-bold leading-tight">{name}</dt>
                  <dd className="font-body text-[15px] leading-relaxed text-paper-muted">{how}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="chzv" className="scroll-mt-6 border-t border-paper-rule">
          <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Eyebrow>Въпроси</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(34px,4.4vw,52px)] font-extrabold leading-[1]">
                Преди да се регистрираш.
              </h2>
            </div>
            <div className="divide-y divide-paper-rule border-y border-paper-rule">
              {FAQ.map(({ question, answer }) => (
                <details key={question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-[20px] font-bold leading-tight [&::-webkit-details-marker]:hidden">
                    {question}
                    <span
                      aria-hidden
                      className="font-mono text-[20px] font-normal text-paper-copper transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-5 font-body text-[16px] leading-relaxed text-paper-muted">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <section id="pregled" className="grid gap-8 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
          <div>
            <h2 className="font-display text-[clamp(34px,4.4vw,52px)] font-extrabold leading-[1] text-ivory">
              Кога ти изтича прегледът?
            </h2>
            <p className="mt-4 max-w-md font-body text-[17px] leading-relaxed text-muted">
              Въведи датата от талона и ще видиш. Без регистрация.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login?mode=signup"
                className="rounded-lg border border-white/12 px-5 py-3 font-body text-[15px] font-semibold text-ivory transition hover:border-white/30"
              >
                Започни безплатно
              </Link>
              <AppStoreBadge />
            </div>
          </div>
          <InspectionCalculator />
        </section>

        {BILLING_ENABLED && <Pricing />}

        <footer className="flex flex-col items-center gap-3 border-t border-white/[0.06] py-8 text-center">
          <p className="font-body text-[13px] text-dim">Glovebox. Сроковете на колата ти, навреме.</p>
          <div className="flex items-center gap-4 font-body text-[13px] text-dim">
            <a href="#chzv" className="transition hover:text-ivory">
              Въпроси
            </a>
            <Link href="/za-nas" className="transition hover:text-ivory">
              За нас
            </Link>
            <Link href="/privacy" className="transition hover:text-ivory">
              Поверителност
            </Link>
            <Link href="/terms" className="transition hover:text-ivory">
              Общи условия
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-paper-copper">
      {children}
    </p>
  );
}

/** Apple's own badge, unaltered, as their marketing guidelines require. */
function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Свали Glovebox от App Store"
      className="inline-block transition hover:opacity-90"
    >
      <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-[50px] w-auto" />
    </a>
  );
}

/** The same questions and answers, for search engines (schema.org FAQPage). */
function FaqStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      // Our own static copy, serialised: nothing a visitor typed can reach this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

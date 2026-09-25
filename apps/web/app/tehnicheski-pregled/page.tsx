import type { Metadata } from "next";
import Link from "next/link";

import { InspectionCalculator } from "@/components/landing/InspectionCalculator";
import { StoreBadge } from "@/components/StoreBadge";
import { Wheel } from "@/components/Wheel";

export const metadata: Metadata = {
  title: "Кога изтича техническият преглед? Калкулатор · Glovebox",
  description:
    "Въведи датата на първа регистрация и виж до кога е техническият преглед на колата. Първи преглед до 3-тата година, втори до 5-тата, после всяка година.",
  alternates: { canonical: "/tehnicheski-pregled" },
};

export const dynamic = "force-static";

/**
 * The inspection calculator on its own address, for the people who search for exactly this.
 * The rules are spelled out under it, because that is what a search result has to answer.
 */
export default function InspectionCalculatorPage() {
  return (
    <main className="relative z-[1] min-h-screen">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-baseline font-brand text-[25px] font-semibold leading-none tracking-tight">
            <span className="text-ivory">Glove</span>
            <span className="flex items-baseline text-copper">
              b
              <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
              x
            </span>
          </Link>
          <Link href="/" className="font-body text-sm text-muted transition hover:text-ivory">
            ← Начало
          </Link>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">Калкулатор</p>
            <h1 className="mt-3 font-display text-[clamp(38px,5vw,60px)] font-extrabold leading-[0.98] text-ivory">
              Кога изтича техническият преглед?
            </h1>
            <p className="mt-5 max-w-md font-body text-[17px] leading-relaxed text-muted">
              Въведи датата на първа регистрация от талона. Ако колата е над пет години, ще те
              питаме и кога беше последният преглед.
            </p>
          </div>
          <InspectionCalculator />
        </section>

        <section className="max-w-2xl pb-16 font-body text-[16px] leading-relaxed text-muted">
          <h2 className="font-display text-[26px] font-bold text-ivory">Как се брои</h2>
          <p className="mt-3">
            За лек автомобил (категория M1) Наредба Н-32 определя три стъпки. Първият преглед е до
            третата година от първата регистрация. Вторият е до петата. След това прегледът е
            всяка година.
          </p>
          <p className="mt-3">
            След петата година срокът тече от последния преглед, не от регистрацията. На
            удостоверението пише &bdquo;Подлежи на преглед до …&ldquo;. Това е същата дата догодина и е
            валидна включително.
          </p>
          <p className="mt-3">
            Колата е внос? Броенето е от първата регистрация изобщо, не от регистрацията в
            България. И тя е в поле (B) на талона.
          </p>

          <h2 className="mt-10 font-display text-[26px] font-bold text-ivory">Не искаш да помниш датата?</h2>
          <p className="mt-3">
            Glovebox ти пише, когато прегледът наближи, и после пак ден-два преди края. Помни и
            гражданската, винетката и данъка. Безплатно е.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-emerald px-6 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
            >
              Започни безплатно
            </Link>
            <StoreBadge source="calculator" />
          </div>
        </section>
      </div>
    </main>
  );
}

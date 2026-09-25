import type { VehiclePassport } from "@glovebox/core";
import Link from "next/link";
import type { ReactNode } from "react";

import { Wheel } from "@/components/Wheel";

import {
  PASSPORT_FOOTNOTE,
  PASSPORT_STATUS,
  PASSPORT_STATUS_ENDED,
  mileageSourceLabel,
  passportCost,
  passportDate,
  passportKm,
  serviceTypeLabel,
  vehicleFacts,
} from "../../_lib/passport";

/** The passport on paper: what a Passport Link opens. */
export function PassportSheet({ passport, pdfHref }: { passport: VehiclePassport; pdfHref: string }) {
  const { vehicle, obligations, mileage, expenses, totalCost } = passport;
  const facts = vehicleFacts(vehicle);

  return (
    <main className="relative z-[1] min-h-screen bg-paper-base px-4 py-10 text-paper-ink sm:py-16">
      <article className="mx-auto max-w-[760px] rounded-doc border border-paper-rule bg-paper-raised px-5 py-8 shadow-[0_18px_40px_-24px_rgba(7,16,12,0.35)] sm:px-10 sm:py-12">
        <header className="flex items-center justify-between gap-4 border-b border-paper-rule pb-5">
          <Link href="/" className="flex items-baseline font-brand text-[20px] font-semibold leading-none">
            <span>Glove</span>
            <span className="flex items-baseline text-paper-copper">
              b
              <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
              x
            </span>
          </Link>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-paper-copper">
            Паспорт на автомобила
          </p>
        </header>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(34px,6vw,48px)] font-extrabold leading-none">
              {vehicle.brand} {vehicle.model}
            </h1>
            {facts && <p className="mt-2 font-body text-[15px] text-paper-muted">{facts}</p>}
          </div>
          {vehicle.plate && (
            <span className="rounded-[4px] border-2 border-paper-ink px-3 py-1 font-mono text-[18px] font-bold tracking-[0.08em]">
              {vehicle.plate}
            </span>
          )}
        </div>
        {vehicle.vin && (
          <p className="mt-3 font-mono text-[13px] text-paper-muted">
            Рама (VIN) <span className="font-bold text-paper-ink">{vehicle.vin}</span>
          </p>
        )}

        <Section title="Пробег">
          {mileage.readings.length === 0 ? (
            <Empty>Няма записани километри.</Empty>
          ) : (
            <>
              {mileage.rolledBack && (
                <p className="mb-4 rounded-doc border border-paper-expired/40 bg-paper-expired/[0.06] px-4 py-3 font-body text-[14px] text-paper-expired">
                  Едно от отчитанията е по-ниско от предишно. Сверете го с удостоверенията за технически преглед.
                </p>
              )}
              <Rows>
                {mileage.readings.map((reading) => (
                  <Row key={reading.readOn.toISOString()}>
                    <span className="font-mono text-[14px]">{passportDate(reading.readOn)}</span>
                    <span className="font-mono text-[15px] font-bold">{passportKm(reading.km)}</span>
                    <span
                      className={`font-body text-[13px] ${
                        reading.source === "certificate" ? "font-semibold text-paper-valid" : "text-paper-muted"
                      }`}
                    >
                      {mileageSourceLabel(reading.source)}
                    </span>
                  </Row>
                ))}
              </Rows>
              {mileage.kmPerYear != null && (
                <p className="mt-3 font-body text-[14px] text-paper-muted">
                  Средно {passportKm(mileage.kmPerYear)} на година.
                </p>
              )}
            </>
          )}
        </Section>

        <Section title="Срокове и подновявания">
          {obligations.length === 0 ? (
            <Empty>Няма записани срокове.</Empty>
          ) : (
            <div className="space-y-6">
              {obligations.map((obligation) => (
                <div key={obligation.serviceType}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-[20px] font-bold">{serviceTypeLabel(obligation.serviceType)}</h3>
                    <span
                      className={`font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${
                        obligation.status === "Valid"
                          ? "text-paper-valid"
                          : obligation.status === "ExpiringSoon"
                            ? "text-paper-expiring"
                            : obligation.status === "Expired"
                              ? "text-paper-expired"
                              : "text-paper-muted"
                      }`}
                    >
                      {obligation.status ? PASSPORT_STATUS[obligation.status] : PASSPORT_STATUS_ENDED}
                    </span>
                  </div>
                  <Rows>
                    {obligation.periods.map((period) => (
                      <Row key={period.until.toISOString()}>
                        <span className={`font-mono text-[14px] ${period.current ? "font-bold" : ""}`}>
                          до {passportDate(period.until)}
                        </span>
                        <span className="font-mono text-[14px]">{passportCost(period.cost) ?? ""}</span>
                        <span className="font-body text-[13px] text-paper-muted">
                          {period.current ? "Текущ срок" : "Подновен"}
                        </span>
                      </Row>
                    ))}
                  </Rows>
                </div>
              ))}
            </div>
          )}
        </Section>

        {expenses.length > 0 && (
          <Section title="Ремонти">
            <Rows>
              {expenses.map((expense, i) => (
                <Row key={`${expense.date.toISOString()}-${i}`}>
                  <span className="font-mono text-[14px]">{passportDate(expense.date)}</span>
                  <span className="font-mono text-[14px]">{passportCost(expense.cost) ?? ""}</span>
                  <span className="font-body text-[13px] text-paper-muted">{serviceTypeLabel(expense.serviceType)}</span>
                </Row>
              ))}
            </Rows>
          </Section>
        )}

        {totalCost != null && totalCost > 0 && (
          <p className="mt-8 flex items-baseline justify-between border-t-2 border-paper-ink pt-4">
            <span className="font-display text-[20px] font-bold">Общо записани разходи</span>
            <span className="font-mono text-[18px] font-bold">{passportCost(totalCost)}</span>
          </p>
        )}

        <footer className="mt-10 border-t border-paper-rule pt-5">
          <p className="font-body text-[13px] leading-relaxed text-paper-muted">{PASSPORT_FOOTNOTE}</p>
          <p className="mt-2 font-mono text-[12px] text-paper-muted">Към {passportDate(passport.generatedOn)}</p>
          <a
            href={pdfHref}
            className="mt-5 inline-block rounded-lg bg-emerald px-5 py-2.5 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Свали като PDF
          </a>
        </footer>
      </article>

      {/* Whoever reads a passport has a car too. */}
      <p className="mx-auto mt-6 max-w-[760px] text-center font-body text-[14px] text-paper-muted">
        Направено с Glovebox. Следи сроковете и на своята кола.{" "}
        <Link href="/" className="font-semibold text-paper-copper underline">
          Започни безплатно
        </Link>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-paper-copper">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="mt-2 divide-y divide-paper-rule border-y border-paper-rule">{children}</div>;
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[150px_140px_1fr]">{children}</div>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="font-body text-[14px] text-paper-muted">{children}</p>;
}

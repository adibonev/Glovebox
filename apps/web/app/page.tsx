import { dueReminders, expiryStatus } from "@glovebox/core";

import { ExpiryGauge } from "./_components/ExpiryGauge";
import { ServiceList } from "./_components/ServiceList";
import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDate,
  formatDaysRemaining,
} from "./_lib/labels";
import {
  sampleServiceRecords,
  sampleVehicle,
  sampleWindows,
  today,
} from "./_lib/sampleVehicle";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const daysUntil = (date: Date) =>
  Math.round((date.getTime() - today.getTime()) / MS_PER_DAY);

export default function DashboardPage() {
  // Expiry Status per Service Record (core), sorted by urgency: overdue/soonest first.
  const items = sampleServiceRecords
    .map((record) => {
      const status = expiryStatus(
        record,
        sampleWindows[record.serviceType] ?? 30,
        today,
      );
      const days = daysUntil(record.expiryDate);
      return {
        id: record.id,
        typeLabel: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
        statusLabel: STATUS_LABELS[status],
        color: STATUS_COLORS[status],
        daysText: formatDaysRemaining(days),
        days,
      };
    })
    .sort((a, b) => a.days - b.days);

  // Most urgent upcoming obligation → the gauge (first of the sorted dueReminders).
  const due = dueReminders(sampleServiceRecords, sampleWindows, today);
  const urgent = due[0];
  const urgentWindow = urgent ? sampleWindows[urgent.serviceType] ?? 30 : 30;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_118%,rgba(196,149,76,0.10),transparent_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-12 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-copper">
            Табло на колата
          </p>
          <h1 className="font-display text-5xl leading-none text-ivory sm:text-6xl">
            {sampleVehicle.name}
          </h1>
          <p className="font-mono text-sm tracking-wide text-silver/70">
            {sampleVehicle.plate} · {sampleVehicle.year}
          </p>
        </header>

        {urgent && (
          <section className="flex flex-col items-center gap-6">
            <ExpiryGauge
              days={urgent.daysUntilExpiry}
              fraction={urgent.daysUntilExpiry / urgentWindow}
              color={STATUS_COLORS.ExpiringSoon}
            />
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-silver/55">
                Най-скоро изтича
              </p>
              <p className="mt-1.5 font-body text-lg text-ivory">
                {SERVICE_TYPE_LABELS[urgent.serviceType] ?? urgent.serviceType}
              </p>
              <p className="font-mono text-sm text-silver/70">
                {formatDate(urgent.expiryDate)}
              </p>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-silver/45">
            Услуги и срокове
          </h2>
          <ServiceList items={items} />
        </section>
      </div>
    </main>
  );
}

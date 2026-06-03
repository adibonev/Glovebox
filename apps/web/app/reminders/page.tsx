import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";

import { saveReminderSettings } from "../_lib/actions";
import {
  SERVICE_TYPE_ICONS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ORDER,
} from "../_lib/labels";
import { getRemindersData, type UpcomingReminder } from "../_lib/reminders";
import { WINDOW_OPTIONS } from "../_lib/reminderSettings";

export const metadata = { title: "Glovebox — Напомняния" };

export default async function RemindersPage() {
  const data = await getRemindersData();
  if (!data) redirect("/login");

  const { config, upcoming } = data;

  return (
    <Shell email={data.userEmail}>
      <div className="anim-up anim-d1 mb-6 mt-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Напомняния</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Кога да те подсетим
        </h1>
        <p className="mt-2 font-body text-muted">
          Избери колко дни преди изтичане да получаваш напомняне за всеки вид услуга.
        </p>
      </div>

      <form
        action={saveReminderSettings}
        className="anim-up anim-d2 rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6 sm:p-7"
      >
        <label className="relative flex cursor-pointer items-center gap-3 pb-5">
          <input
            type="checkbox"
            name="reminder_enabled"
            defaultChecked={config.enabled}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-emerald" />
          <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-ivory shadow transition peer-checked:translate-x-5" />
          <span className="ml-1 font-body font-medium text-ivory">Имейл напомняния</span>
        </label>

        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {SERVICE_TYPE_ORDER.map((serviceType) => (
            <div
              key={serviceType}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-2.5 font-body text-ivory">
                <span aria-hidden className="text-lg">
                  {SERVICE_TYPE_ICONS[serviceType]}
                </span>
                {SERVICE_TYPE_LABELS[serviceType]}
              </span>

              <fieldset className="flex flex-wrap gap-1.5">
                {WINDOW_OPTIONS.map((opt) => (
                  <label key={opt} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`window_${serviceType}`}
                      value={opt}
                      defaultChecked={(config.windows[serviceType] ?? 30) === opt}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-[13px] text-muted transition hover:border-white/25 peer-checked:border-copper/60 peer-checked:bg-copper/[0.12] peer-checked:text-copper">
                      {opt}
                    </span>
                  </label>
                ))}
                <span className="ml-1 self-center font-body text-[13px] text-dim">дни</span>
              </fieldset>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-emerald px-5 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Запази
          </button>
        </div>
      </form>

      <section className="mt-9">
        <h2 className="mb-4 font-display text-[22px] font-semibold tracking-tight text-ivory">
          Предстоящи напомняния
        </h2>
        {upcoming.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <ReminderRow key={r.id} reminder={r} />
            ))}
          </ul>
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center">
            <p className="font-body text-muted">Няма услуги, за които да напомняме още.</p>
          </div>
        )}
      </section>
    </Shell>
  );
}

function ReminderRow({ reminder }: { reminder: UpcomingReminder }) {
  const { serviceTypeLabel, vehicleName, reminderDateLabel, expiryDateLabel, color, daysUntilReminder } =
    reminder;

  const when =
    daysUntilReminder <= 0
      ? "напомняме сега"
      : daysUntilReminder === 1
        ? "напомняме утре"
        : `напомняме след ${daysUntilReminder} дни`;

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body font-medium text-ivory">
          {serviceTypeLabel} <span className="text-dim">·</span>{" "}
          <span className="text-muted">{vehicleName}</span>
        </p>
        <p className="mt-0.5 font-body text-[13px] text-dim">
          {when} ({reminderDateLabel}) · изтича {expiryDateLabel}
        </p>
      </div>
    </li>
  );
}

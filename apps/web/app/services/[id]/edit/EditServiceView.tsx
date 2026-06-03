"use client";

import Link from "next/link";
import { useState } from "react";

import { updateService } from "@/app/_lib/actions";
import { SERVICE_TYPE_ICONS, SERVICE_TYPE_LABELS } from "@/app/_lib/labels";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);

export function EditServiceView({
  serviceId,
  serviceType,
  expiryDate,
  notes,
}: {
  serviceId: string;
  serviceType: string;
  expiryDate: string;
  notes: string;
}) {
  const [type, setType] = useState(TYPES.includes(serviceType) ? serviceType : TYPES[0]);

  return (
    <form action={updateService} className="flex flex-col gap-7">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="serviceType" value={type} />

      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Вид услуга
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TYPES.map((code) => {
            const active = type === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setType(code)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                  active
                    ? "border-copper bg-copper/10 text-ivory"
                    : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
                }`}
              >
                <span className="text-2xl leading-none">{SERVICE_TYPE_ICONS[code]}</span>
                <span className="font-body text-[13px] leading-tight">
                  {SERVICE_TYPE_LABELS[code]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Дата на изтичане
        </span>
        <input
          type="date"
          name="expiryDate"
          defaultValue={expiryDate}
          required
          className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Бележка · по избор
        </span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={notes}
          className="resize-none rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/"
          className="rounded-xl px-4 py-2.5 font-body text-sm text-silver/60 transition hover:text-ivory"
        >
          Отказ
        </Link>
        <button
          type="submit"
          className="rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Запази промените
        </button>
      </div>
    </form>
  );
}

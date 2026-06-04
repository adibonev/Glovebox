"use client";

import { isExpiringServiceType } from "@glovebox/core";
import Link from "next/link";
import { useState } from "react";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { addService } from "../_lib/actions";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AddServiceView({ vehicleId }: { vehicleId: string }) {
  const [type, setType] = useState(TYPES[0] ?? "civil_liability");
  const expiring = isExpiringServiceType(type);

  return (
    <form action={addService} className="flex flex-col gap-7">
      <input type="hidden" name="vehicleId" value={vehicleId} />
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
                <ServiceTypeIcon type={code} className="h-7 w-7" />
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
          {expiring ? "Дата на изтичане" : "Дата на разход"}
        </span>
        <input
          type="date"
          name="expiryDate"
          defaultValue={todayIso()}
          required
          className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Цена (€) · по избор
        </span>
        <input
          type="number"
          name="cost"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="напр. 120"
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
          Добави услуга
        </button>
      </div>
    </form>
  );
}

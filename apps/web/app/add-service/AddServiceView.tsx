"use client";

import { isExpiringServiceType } from "@glovebox/core";
import Link from "next/link";
import { useState } from "react";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { addService } from "../_lib/actions";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";

// rta.government.bg gates the ГТП check behind a captcha, so we can't auto-fetch it (and shouldn't —
// ToS). The button opens the official check; the User reads the date there and confirms it here.
const RTA_INSPECTION_URL = "https://rta.government.bg/services/check-inspection/index.html";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AddServiceView({ vehicleId, plate = null }: { vehicleId: string; plate?: string | null }) {
  const [type, setType] = useState(TYPES[0] ?? "civil_liability");
  const [expiryDate, setExpiryDate] = useState(todayIso());
  const [cost, setCost] = useState("");
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

      {/* Registry Check (ГТП): the official source has a captcha, so we link out — the User checks
          there and confirms the date here (no auto-write). */}
      {type === "inspection" && plate && (
        <div className="flex flex-col gap-2 rounded-2xl border border-copper/30 bg-copper/[0.06] p-4">
          <a
            href={RTA_INSPECTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-copper/50 px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:bg-copper/10"
          >
            🛡️ Провери ГТП в официалния регистър ↗
          </a>
          <p className="font-body text-[12px] text-silver/60">
            Въведи <span className="font-mono text-silver">{plate}</span> + кода от картинката в
            Автомобилна администрация, виж датата „валиден до" и я попълни тук.
          </p>
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          {expiring ? "Дата на изтичане" : "Дата на разход"}
        </span>
        <input
          type="date"
          name="expiryDate"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
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
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="напр. 120"
          className="rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55">
          Документ · по избор
        </span>
        <input
          type="file"
          name="document"
          accept="application/pdf,image/*"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-ink/60 py-2 pl-2 pr-4 font-body text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ivory hover:file:bg-emerald/90 focus:border-copper/60"
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

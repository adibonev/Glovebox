"use client";

import { isExpiringServiceType, readPolicy, scanInspectionDocument } from "@glovebox/core";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { addService } from "../_lib/actions";
import { NO_FORM_ERROR } from "../_lib/formState";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";
import { readDocument } from "../_lib/scan";
import { documentTooLargeMessage } from "../_lib/upload";

/** Service Types whose document we know how to read. Everything else is attached as-is. */
const READABLE_TYPES = new Set(["inspection", "civil_liability", "casco"]);

/** `YYYY-MM-DD` for a date input. */
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

// rta.government.bg gates the ГТП check behind a captcha, so we can't auto-fetch it (and shouldn't —
// ToS). The button opens the official check; the User reads the date there and confirms it here.
const RTA_INSPECTION_URL = "https://rta.government.bg/services/check-inspection/index.html";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AddServiceView({ vehicleId, plate = null }: { vehicleId: string; plate?: string | null }) {
  const [type, setType] = useState(TYPES[0] ?? "civil_liability");
  const [expiryDate, setExpiryDate] = useState(todayIso());
  const [cost, setCost] = useState("");
  // A file over the Server Action body limit is refused here — sending it would blow up the
  // whole submit before any of our code runs, and the Service Record would be lost silently.
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [state, submit] = useActionState(addService, NO_FORM_ERROR);
  const expiring = isExpiringServiceType(type);
  const error = fileError ?? state.error;

  /**
   * Read an attached document and fill the date (and the amount, on a policy) from it.
   *
   * Recognition runs on this device — attaching and reading are the same gesture, but nothing
   * is uploaded until the form is submitted. Every filled value stays editable.
   */
  async function fillFromDocument(file: File) {
    if (!READABLE_TYPES.has(type) || !file.type.startsWith("image/")) return;

    setReading(true);
    setScanNote(null);
    try {
      const input = await readDocument(file);
      const expiry =
        type === "inspection"
          ? scanInspectionDocument(input).serviceRecord?.expiryDate ?? null
          : readPolicy(input.text).expiryDate;

      if (expiry) setExpiryDate(isoDay(expiry));

      // Only a policy states an amount due; a certificate never does.
      const due = type === "inspection" ? null : readPolicy(input.text).cost;
      if (due != null) setCost(String(due));

      setScanNote(
        expiry
          ? "Попълних от документа. Провери стойностите, преди да запазиш."
          : "Не разчетох дата от документа — попълни я ръчно. Файлът пак ще се запази.",
      );
    } catch {
      setScanNote("Разчитането не сработи. Попълни ръчно — файлът пак ще се запази.");
    } finally {
      setReading(false);
    }
  }

  return (
    <form action={submit} className="flex flex-col gap-7">
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileError(documentTooLargeMessage(file));
            if (file) void fillFromDocument(file);
          }}
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-ink/60 py-2 pl-2 pr-4 font-body text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ivory hover:file:bg-emerald/90 focus:border-copper/60"
        />
        {READABLE_TYPES.has(type) && (
          <span className="font-body text-[12px] text-silver/55">
            {reading
              ? "Разчитам документа на твоето устройство…"
              : (scanNote ??
                "Прикачи снимка на документа и ще попълня датата вместо теб.")}
          </span>
        )}
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

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#E0705C]/40 bg-[#E0705C]/10 px-4 py-3 font-body text-sm text-[#E0705C]"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/"
          className="rounded-xl px-4 py-2.5 font-body text-sm text-silver/60 transition hover:text-ivory"
        >
          Отказ
        </Link>
        <SubmitButton disabled={fileError !== null} />
      </div>
    </form>
  );
}

/** The submit control, showing progress so a slow save never looks like a dead button. */
function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Записване…" : "Добави услуга"}
    </button>
  );
}

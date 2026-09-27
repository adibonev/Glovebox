"use client";

import { isExpiringServiceType, vignetteExpiry, type VignetteKind } from "@glovebox/core";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ServiceTypeIcon } from "../_components/ServiceTypeIcon";
import { addService } from "../_lib/actions";
import { NO_FORM_ERROR } from "../_lib/formState";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";
import { documentTooLargeMessage } from "../_lib/upload";

// rta.government.bg gates the ГТП check behind a captcha, so we can't auto-fetch it (and shouldn't:
// ToS). The button opens the official check; the User reads the date there and confirms it here.
const RTA_INSPECTION_URL = "https://rta.government.bg/services/check-inspection/index.html";

const TYPES = Object.keys(SERVICE_TYPE_LABELS);

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

/**
 * The Vignette durations the Road Infrastructure Agency sells. Nobody knows the date their
 * Vignette runs out — they know which one they bought and when. Pick those two and the Expiry
 * Date follows by arithmetic, which beats guessing at a calendar.
 */
const VIGNETTE_KINDS: { kind: VignetteKind; label: string }[] = [
  { kind: "weekend", label: "Уикенд" },
  { kind: "weekly", label: "Седмична" },
  { kind: "monthly", label: "Месечна" },
  { kind: "quarterly", label: "Тримесечна" },
  { kind: "annual", label: "Годишна" },
];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Expiry for a Vignette bought on `startIso`, as `YYYY-MM-DD`, or "" if the date is unusable. */
function vignetteExpiryIso(startIso: string, kind: VignetteKind): string {
  const start = new Date(`${startIso}T00:00:00Z`);
  return Number.isNaN(start.getTime()) ? "" : isoDay(vignetteExpiry(start, kind));
}

export type AddServiceVehicle = { id: string; name: string; plate: string | null };

/**
 * A new Service Record. It says which car it goes on (and offers the others), and starts the
 * date a year on: an obligation just paid for runs about a year, while a Repair happened today.
 */
export function AddServiceView({
  vehicles,
  vehicleId: initialVehicleId,
  initialType,
  today,
  yearOn,
  returnTo = null,
}: {
  vehicles: AddServiceVehicle[];
  vehicleId: string;
  /** Service Type to start on, when the setup checklist asked for a particular one. */
  initialType?: string;
  /** Today and a year on, both `YYYY-MM-DD` in Sofia (the server's clock is UTC). */
  today: string;
  yearOn: string;
  /** Where to go after saving; null lands on the dashboard, on the same car. */
  returnTo?: string | null;
}) {
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [type, setType] = useState(
    initialType && TYPES.includes(initialType) ? initialType : (TYPES[0] ?? "civil_liability"),
  );
  const expiring = isExpiringServiceType(type);
  // The date follows the kind until the User sets it: a year on for an obligation, today for a
  // Repair. Once typed, it stays what they typed.
  const [typedDate, setTypedDate] = useState<string | null>(null);
  const expiryDate = typedDate ?? (expiring ? yearOn : today);
  const [cost, setCost] = useState("");
  // A file over the Server Action body limit is refused here — sending it would blow up the
  // whole submit before any of our code runs, and the Service Record would be lost silently.
  const [fileError, setFileError] = useState<string | null>(null);
  const [vignetteKind, setVignetteKind] = useState<VignetteKind>("annual");
  const [vignetteStart, setVignetteStart] = useState(today);
  const [state, submit] = useActionState(addService, NO_FORM_ERROR);
  const error = fileError ?? state.error;

  const vehicle = vehicles.find((candidate) => candidate.id === vehicleId) ?? vehicles[0];
  const plate = vehicle?.plate ?? null;

  // A Vignette states its duration, not its end: the User picks what they bought and when.
  const isVignette = type === "vignette";
  const submittedExpiry = isVignette ? vignetteExpiryIso(vignetteStart, vignetteKind) : expiryDate;

  return (
    <form action={submit} className="flex flex-col gap-7">
      <input type="hidden" name="serviceType" value={type} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      {vehicles.length > 1 ? (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Кола</span>
          <select
            name="vehicleId"
            value={vehicleId}
            onChange={(event) => setVehicleId(event.target.value)}
            className={fieldClass}
          >
            {vehicles.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
                {candidate.plate ? ` · ${candidate.plate}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="font-body text-sm text-muted">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          За <span className="text-ivory">{vehicle?.name}</span>
          {plate && <span className="font-mono text-silver"> · {plate}</span>}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <span className={labelClass}>Вид</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TYPES.map((code) => {
            const active = type === code;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setType(code)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                  active
                    ? "border-copper bg-copper/10 text-ivory"
                    : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
                }`}
              >
                <ServiceTypeIcon type={code} className="h-7 w-7" />
                <span className="font-body text-[13px] leading-tight">{SERVICE_TYPE_LABELS[code]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Registry Check (ГТП): the official source has a captcha, so we link out. The User checks
          there and confirms the date here (no auto-write). */}
      {type === "inspection" && plate && (
        <div className="flex flex-col gap-2 rounded-2xl border border-copper/30 bg-copper/[0.06] p-4">
          <a
            href={RTA_INSPECTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-copper/50 px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:bg-copper/10"
          >
            Провери прегледа в официалния регистър ↗
          </a>
          <p className="font-body text-[13px] text-muted">
            В сайта на Автомобилна администрация въведи <span className="font-mono text-silver">{plate}</span> и
            кода от картинката, после попълни тук датата „валиден до“.
          </p>
        </div>
      )}

      {isVignette ? (
        <div className="flex flex-col gap-4">
          <input type="hidden" name="expiryDate" value={submittedExpiry} />

          <div className="flex flex-col gap-3">
            <span className={labelClass}>Каква винетка купи</span>
            <div className="flex flex-wrap gap-2">
              {VIGNETTE_KINDS.map(({ kind, label }) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={vignetteKind === kind}
                  onClick={() => setVignetteKind(kind)}
                  className={`rounded-xl border px-4 py-2 font-body text-sm transition ${
                    vignetteKind === kind
                      ? "border-copper bg-copper/10 text-ivory"
                      : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>От дата</span>
            <input
              type="date"
              value={vignetteStart}
              onChange={(e) => setVignetteStart(e.target.value)}
              required
              className={fieldClass}
            />
          </label>

          <p className="font-body text-sm text-silver/75">
            Изтича на{" "}
            <strong className="font-mono text-ivory">
              {submittedExpiry ? submittedExpiry.split("-").reverse().join(".") : "…"}
            </strong>
          </p>
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{expiring ? "В сила до" : "Дата на разхода"}</span>
          <input
            type="date"
            name="expiryDate"
            value={expiryDate}
            onChange={(e) => setTypedDate(e.target.value)}
            required
            className={fieldClass}
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          Цена (€) <span className="text-dim">· по избор</span>
        </span>
        <input
          type="text"
          name="cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          inputMode="decimal"
          placeholder="напр. 120"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          Документ <span className="text-dim">· по избор</span>
        </span>
        <input
          type="file"
          name="document"
          accept="application/pdf,image/*"
          onChange={(e) => setFileError(documentTooLargeMessage(e.target.files?.[0]))}
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-ink/60 py-2 pl-2 pr-4 font-body text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ivory hover:file:bg-emerald/90 focus:border-copper/60"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          Бележка <span className="text-dim">· по избор</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          placeholder="Застраховател, номер на полицата, сервиз…"
          className={`${fieldClass} resize-none`}
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-status-expired/40 bg-status-expired/10 px-4 py-3 font-body text-sm text-status-expired"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={returnTo ?? `/?v=${initialVehicleId}`}
          className="rounded-xl px-4 py-2.5 font-body text-sm text-muted transition hover:text-ivory"
        >
          Отказ
        </Link>
        <SubmitButton label={expiring ? "Запази срока" : "Запази разхода"} disabled={fileError !== null} />
      </div>
    </form>
  );
}

/** The submit control, showing progress so a slow save never looks like a dead button. */
function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-xl bg-emerald px-5 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Записване…" : label}
    </button>
  );
}

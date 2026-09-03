"use client";

import {
  missingVehicleFields,
  scanInspectionDocument,
  vinChecksumValid,
  type InspectionDraft,
} from "@glovebox/core";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { addScannedVehicle } from "../../_lib/actions";
import { NO_FORM_ERROR } from "../../_lib/formState";
import { readDocument } from "../../_lib/scan";
import { documentTooLargeMessage } from "../../_lib/upload";
import { BodyTypePicker } from "../../_components/BodyTypePicker";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.2em] text-silver/55";

/** `YYYY-MM-DD` for a date input, or "" when the scan found no date. */
function dateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
    >
      {pending ? "Запазване…" : "Запази колата"}
    </button>
  );
}

/** An all-empty Draft, so a file we cannot read still opens the form for manual entry. */
const BLANK_DRAFT: InspectionDraft = {
  vehicle: { brand: null, model: null, year: null, plate: null, vin: null },
  serviceRecord: null,
  firstRegistration: null,
  certificateUrl: null,
};

/** Bulgarian names for the fields a scan can leave empty, in the order they appear. */
const FIELD_NAMES: Record<string, string> = {
  brand: "марка",
  model: "модел",
  year: "година",
  plate: "рег. номер",
  vin: "рама",
};

/**
 * What to tell the User after a scan. Naming the fields that came back empty is far more use
 * than "не успях да разчета документа" over a form that is half filled in — and when the Expiry
 * Date is the missing one, the cause is nearly always the same: the last line of the
 * certificate sat outside the frame.
 */
function scanSummary(draft: InspectionDraft): string | null {
  const missing = missingVehicleFields(draft.vehicle).map((field) => FIELD_NAMES[field] ?? field);
  if (!draft.serviceRecord) missing.unshift("срокът на прегледа");
  if (missing.length === 0) return null;

  const tail = draft.serviceRecord
    ? ""
    : " Срокът е на последния ред на удостоверението — ако не е влязъл в кадъра, снимай пак с целия долен ред.";

  return `Разчетох част от данните. Допълни ръчно: ${missing.join(", ")}.${tail}`;
}

/**
 * Step one of the automatic onboarding: photograph or attach the Roadworthiness Inspection
 * certificate, confirm what was read, save the Vehicle and the Inspection in one go.
 *
 * Recognition happens on this device (`_lib/scan.ts`) — the file is uploaded only if the User
 * ticks the box to keep it. Every field stays editable, and "въведи ръчно" is always one click
 * away, so a failed scan is a detour and never a dead end.
 */
export function ScanVehicleForm() {
  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [state, submit] = useActionState(addScannedVehicle, NO_FORM_ERROR);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    // Only blocks keeping the file, not reading it — recognition never uploads anything.
    setScanError(documentTooLargeMessage(file));

    // A PDF has no pixels to recognise without a renderer. Rather than fail silently, open the
    // form empty so the User can type the dates in and still keep the file.
    if (file.type === "application/pdf") {
      setDraft(BLANK_DRAFT);
      setScanError("PDF файловете още не се разчитат. Въведи данните ръчно — файлът пак може да се запази.");
      return;
    }

    setReading(true);
    setProgress(0);
    try {
      const input = await readDocument(file, setProgress);
      const scanned = scanInspectionDocument(input);
      setDraft(scanned);
      setScanError(scanSummary(scanned));
    } catch {
      setDraft(BLANK_DRAFT);
      setScanError("Разчитането не сработи. Опитай пак с по-ясна снимка или въведи ръчно.");
    } finally {
      setReading(false);
    }
  }

  const error = scanError ?? state.error;

  return (
    <form action={submit} className="flex flex-col gap-6">
      {/*
        Two inputs, both named "document", so whichever the User reached for carries the file
        through to the action — it reads them with getAll and takes the one that is not empty.
        Kept mounted after the scan so the same file can still be saved as a Document.
      */}
      <input
        ref={cameraRef}
        type="file"
        name="document"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        name="document"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {!draft && (
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-md">
          <p className="font-body text-silver/75">
            Дай <strong className="text-ivory">удостоверението за технически преглед</strong> —
            оттам излизат и колата, и срокът на прегледа.
          </p>
          <div className="mx-auto flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={reading}
              className="rounded-xl bg-copper px-5 py-2.5 font-body font-semibold text-ink transition hover:bg-copper/90 disabled:opacity-60"
            >
              {reading ? "Разчитам…" : "Снимай документа"}
            </button>
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              disabled={reading}
              className="rounded-xl border border-white/15 px-5 py-2.5 font-body font-semibold text-silver/80 transition hover:border-white/30 hover:text-ivory disabled:opacity-60"
            >
              Прикачи файл
            </button>
          </div>

          {reading && (
            <div className="mx-auto w-full max-w-xs">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-copper transition-[width]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-silver/50">
                разчитането тече на твоето устройство
              </p>
            </div>
          )}

          <Link href="/vehicles/new" className="font-body text-sm text-muted transition hover:text-ivory">
            Предпочитам да въведа ръчно
          </Link>
        </div>
      )}

      {draft && (
        <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Провери данните</span>
            <p className="font-body text-sm text-silver/70">
              Разчетох ги от документа. Поправи каквото не е вярно, преди да запазиш.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="brand"
              required
              defaultValue={draft.vehicle.brand ?? ""}
              placeholder="Марка"
              className={fieldClass}
            />
            <input
              name="model"
              required
              defaultValue={draft.vehicle.model ?? ""}
              placeholder="Модел"
              className={fieldClass}
            />
            <input
              name="year"
              type="number"
              defaultValue={draft.vehicle.year ?? ""}
              placeholder="Година"
              className={fieldClass}
            />
            <input
              name="plate"
              defaultValue={draft.vehicle.plate ?? ""}
              placeholder="Рег. номер"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <input
              name="vin"
              maxLength={17}
              defaultValue={draft.vehicle.vin ?? ""}
              placeholder="VIN / рама"
              className={`${fieldClass} uppercase placeholder:normal-case`}
            />
            {/*
              A VIN carries its own check digit, and OCR reliably turns 4 into A, 5 into S and
              8 into B. One wrong character reads as convincingly as a correct one, so this is
              the only place a person gets told to look twice.
            */}
            {draft.vehicle.vin && !vinChecksumValid(draft.vehicle.vin) && (
              <span className="font-body text-[12px] text-expiring">
                Сверѝ рамата знак по знак — контролната ѝ цифра не излиза. Разчитането обърква
                4 с A, 5 с S и 8 с B.
              </span>
            )}
          </div>

          <BodyTypePicker />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelClass}>Преглед валиден до</span>
              <input
                name="expiryDate"
                type="date"
                defaultValue={dateInputValue(draft.serviceRecord?.expiryDate ?? null)}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelClass}>Километраж</span>
              <input
                name="mileage"
                type="number"
                inputMode="numeric"
                defaultValue=""
                placeholder="км"
                className={fieldClass}
              />
            </label>
          </div>

          <input type="hidden" name="checkUrl" value={draft.certificateUrl ?? ""} />

          {draft.certificateUrl && (
            <a
              href={draft.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-copper/40 bg-copper/10 px-4 py-3 text-center font-body text-sm text-ivory transition hover:border-copper"
            >
              Виж пълната официална справка →
            </a>
          )}

          <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink/40 px-4 py-3">
            <input type="checkbox" name="saveDocument" className="mt-1 accent-emerald" />
            <span className="font-body text-sm text-silver/75">
              Запази снимката на документа в Glovebox. Досега тя не е напускала устройството ти.
            </span>
          </label>

          <SubmitButton />

          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setScanError(null);
            }}
            className="font-body text-sm text-muted transition hover:text-ivory"
          >
            Сканирай друг документ
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-expired/40 bg-expired/10 px-4 py-3 font-body text-sm text-ivory">
          {error}
        </p>
      )}
    </form>
  );
}

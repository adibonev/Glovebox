"use client";

import { vignetteExpiry, type VignetteKind } from "@glovebox/core/schedule";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { renewService } from "../../_lib/actions";

const VIGNETTE_KINDS: { kind: VignetteKind; label: string }[] = [
  { kind: "weekend", label: "Уикенд" },
  { kind: "weekly", label: "Седмична" },
  { kind: "monthly", label: "Месечна" },
  { kind: "quarterly", label: "Тримесечна" },
  { kind: "annual", label: "Годишна" },
];

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

/** Today in the visitor's own calendar, as `YYYY-MM-DD`. */
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Renewing: the new Expiry Date (offered a year on, see core `suggestedExpiry`) and what the new
 * period cost. A Vignette is renewed by what was bought and when, and its end follows.
 */
export function RenewForm({
  serviceId,
  isVignette,
  suggested,
}: {
  serviceId: string;
  isVignette: boolean;
  suggested: string;
}) {
  const [expiry, setExpiry] = useState(suggested);
  const [kind, setKind] = useState<VignetteKind>("annual");
  const [start, setStart] = useState(todayIso);
  const vignetteEnd = /^\d{4}-\d{2}-\d{2}$/.test(start)
    ? vignetteExpiry(new Date(`${start}T00:00:00Z`), kind).toISOString().slice(0, 10)
    : "";
  const submitted = isVignette ? vignetteEnd : expiry;

  return (
    <form action={renewService} className="flex flex-col gap-5">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="expiryDate" value={submitted} />

      {isVignette ? (
        <>
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Каква винетка купи</span>
            <div className="flex flex-wrap gap-2">
              {VIGNETTE_KINDS.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  aria-pressed={kind === option.kind}
                  onClick={() => setKind(option.kind)}
                  className={`rounded-xl border px-4 py-2 font-body text-sm transition ${
                    kind === option.kind
                      ? "border-copper bg-copper/10 text-ivory"
                      : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>От дата</span>
            <input type="date" value={start} onChange={(event) => setStart(event.target.value)} required className={fieldClass} />
          </label>
          <p className="font-body text-sm text-silver/75">
            Новата изтича на{" "}
            <strong className="font-mono text-ivory">{vignetteEnd ? vignetteEnd.split("-").reverse().join(".") : "…"}</strong>
          </p>
        </>
      ) : (
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Нов срок до</span>
          <input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} required className={fieldClass} />
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className={labelClass}>
          Цена (€) <span className="text-dim">· по избор</span>
        </span>
        <input type="text" name="cost" inputMode="decimal" placeholder="напр. 245" className={fieldClass} />
      </label>

      <SubmitButton disabled={!submitted} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="self-start rounded-xl bg-emerald px-5 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90 disabled:opacity-60"
    >
      {pending ? "Записване…" : "Запази новия срок"}
    </button>
  );
}

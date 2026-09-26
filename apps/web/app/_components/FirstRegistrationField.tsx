"use client";

import { firstRegistrationProblem } from "@glovebox/core/schedule";
import { useEffect, useRef, useState } from "react";

import { recalledFirstRegistration } from "@/lib/firstRegistration";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

/** Today as `YYYY-MM-DD` in the visitor's own calendar: the latest date the field accepts. */
function todayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

/** What stops this date from going with this car, in the words the browser shows; "" when nothing. */
function problemWith(dateIso: string, yearRaw: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return "";
  const year = /^\d{4}$/.test(yearRaw.trim()) ? Number(yearRaw.trim()) : null;
  switch (firstRegistrationProblem(new Date(`${dateIso}T00:00:00Z`), year, new Date(`${todayIso()}T00:00:00Z`))) {
    case "beforeYear":
      return `Датата на първа регистрация е преди ${year} г., годината на колата. Провери едното от двете.`;
    case "inFuture":
      return "Датата на първа регистрация е в бъдещето.";
    default:
      return "";
  }
}

/**
 * Date of first registration, field (B) of the registration certificate. Optional: with it the
 * app knows when the statutory Roadworthiness Inspections fall due for a car under five years old.
 * Left empty, it offers the date the visitor already typed into the inspection calculator.
 *
 * A car is not registered before the year it was made, nor after today. The check watches the
 * whole form, because the year can change after the date, and holds the submit with the reason.
 */
export function FirstRegistrationField({ value }: { value?: string | null }) {
  const [date, setDate] = useState(value ?? "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) setDate((current) => current || recalledFirstRegistration() || "");
  }, [value]);

  useEffect(() => {
    const field = input.current;
    const form = field?.form;
    if (!field || !form) return;
    // Set here rather than rendered: the server's today and the visitor's can differ at midnight.
    field.max = todayIso();
    const check = () => {
      const year = form.elements.namedItem("year") as HTMLInputElement | HTMLSelectElement | null;
      field.setCustomValidity(problemWith(field.value, year?.value ?? ""));
    };
    check();
    form.addEventListener("input", check);
    form.addEventListener("change", check);
    return () => {
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
    };
  }, [date]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-sm text-muted">
        Дата на първа регистрация <span className="text-dim">· по избор, поле (B) на талона</span>
      </span>
      <input
        ref={input}
        type="date"
        name="firstRegistration"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

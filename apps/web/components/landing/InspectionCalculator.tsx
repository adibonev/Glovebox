"use client";

import { inspectionDue, type InspectionDue } from "@glovebox/core/schedule";
import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_STORE_URL } from "@/lib/appStore";
import { rememberFirstRegistration } from "@/lib/firstRegistration";

const MS_PER_DAY = 86_400_000;

/** "YYYY-MM-DD" from a date input, as the UTC midnight the domain uses; null when empty or bad. */
function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today on the visitor's own calendar, as a UTC midnight like every other date here. */
function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const pad = (n: number) => String(n).padStart(2, "0");
const show = (date: Date) => `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;

const WHY: Record<Exclude<InspectionDue["kind"], "needsLastInspection">, string> = {
  first: "Нова кола минава първи преглед до третата година от регистрацията.",
  second: "Вторият преглед е до петата година от регистрацията.",
  annual: "След петата година прегледът е всяка година, до същата дата като последния.",
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/12 bg-ink2 px-4 py-3 font-mono text-[15px] text-ivory outline-none transition focus:border-copper/60";

/**
 * The answer to "Кога ти изтича прегледът?", worked out on the page: the date of first
 * registration, and for a car over five years old the date of the last Inspection too.
 */
export function InspectionCalculator() {
  const [registered, setRegistered] = useState("");
  const [lastInspection, setLastInspection] = useState("");
  const [iPhone, setIPhone] = useState(false);

  useEffect(() => {
    setIPhone(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  const firstRegistration = parseDay(registered);
  // Read at render, not at build: the page is prebuilt, and today is the visitor's day.
  const now = today();
  const result = firstRegistration ? inspectionDue(firstRegistration, parseDay(lastInspection), now) : null;
  // Over five years old, the date runs from the last Inspection: ask for it, and keep asking.
  const asksForLast = result?.kind === "needsLastInspection" || result?.kind === "annual";

  return (
    <div className="rounded-card border border-white/10 bg-panel p-5 sm:p-6">
      <label className="block font-body text-sm text-silver">
        Дата на първа регистрация
        <span className="block text-[13px] text-dim">Поле (B) на регистрационния талон.</span>
        <input
          type="date"
          value={registered}
          onChange={(event) => {
            setRegistered(event.target.value);
            // Kept for the first car's form, so the answer is not typed twice.
            rememberFirstRegistration(event.target.value);
          }}
          className={inputClass}
        />
      </label>

      {asksForLast && (
        <label className="mt-4 block font-body text-sm text-silver">
          Кога беше последният преглед?
          <span className="block text-[13px] text-dim">
            Колата е над пет години, затова срокът тече от последния преглед. Ред (3) на
            удостоверението.
          </span>
          <input
            type="date"
            value={lastInspection}
              onChange={(event) => setLastInspection(event.target.value)}
            className={inputClass}
          />
        </label>
      )}

      {result && result.kind !== "needsLastInspection" && (
        <Answer due={result.due} why={WHY[result.kind]} now={now} registered={registered} iPhone={iPhone} />
      )}
    </div>
  );
}

function Answer({
  due,
  why,
  now,
  registered,
  iPhone,
}: {
  due: Date;
  why: string;
  now: Date;
  registered: string;
  iPhone: boolean;
}) {
  const days = Math.round((due.getTime() - now.getTime()) / MS_PER_DAY);
  const tone = days < 0 ? "text-status-expired" : days <= 30 ? "text-status-expiring" : "text-status-valid";

  return (
    <div className="mt-5 border-t border-white/[0.08] pt-5" aria-live="polite">
      <p className="font-display text-[26px] font-bold leading-tight text-ivory">
        Прегледът ти е до <span className="font-mono text-copper">{show(due)}</span> включително.
      </p>
      <p className={`mt-1.5 font-body text-[15px] font-semibold ${tone}`}>
        {days < 0
          ? `Изтекъл е преди ${-days} ${-days === 1 ? "ден" : "дни"}.`
          : days === 0
            ? "Днес е последният ден."
            : `Остават ${days} ${days === 1 ? "ден" : "дни"}.`}
      </p>
      <p className="mt-2 font-body text-[14px] text-muted">{why}</p>
      {/* On an iPhone the reminder that matters is the app's; elsewhere, sign up with the date kept. */}
      {iPhone ? (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-lg bg-emerald px-5 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Напомни ми преди него
        </a>
      ) : (
        <Link
          href={`/login?mode=signup&fr=${registered}`}
          className="mt-5 inline-block rounded-lg bg-emerald px-5 py-3 font-body text-[15px] font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Напомни ми преди него
        </Link>
      )}
    </div>
  );
}

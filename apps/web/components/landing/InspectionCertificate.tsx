import type { ReactNode } from "react";

/**
 * A Roadworthiness Inspection certificate, set in type the way the state prints it, with the
 * fields the app reads off it marked.
 *
 * A drawing, not a photo, and every value on it is made up: a real certificate carries its
 * owner's name and personal number, and those have no business on a public page. The layout and
 * the field numbers are the real ones, because that is what a driver recognises from the glovebox.
 */
export function InspectionCertificate() {
  return (
    <figure
      aria-label="Удостоверение за техническа изправност с отбелязаните полета, които приложението чете"
      className="rounded-doc border border-paper-rule bg-paper-raised px-5 pb-6 pt-5 text-paper-form shadow-[0_1px_0_rgba(7,16,12,0.04),0_18px_40px_-24px_rgba(7,16,12,0.35)] sm:px-7"
    >
      <p className="text-center font-body text-[13px] font-extrabold uppercase leading-tight tracking-[0.04em] sm:text-[15px]">
        Удостоверение за техническа изправност на ППС
      </p>
      <div className="mt-1.5 flex justify-between font-body text-[10.5px] sm:text-[11.5px]">
        <span>Протокол №: 41207733</span>
        <span>Начало: 03.03.2026 10:12</span>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-1.5 rounded-doc border border-paper-form/25 px-3.5 py-3 font-body text-[11.5px] sm:grid-cols-2 sm:text-[12.5px]">
        <Line label="(2) Рег. №">
          <Mark n={1}>CB4521KX</Mark>
        </Line>
        <Line label="(1) VIN, рама">
          <Mark n={2}>WBA8E31000K123456</Mark>
        </Line>
        <Line label="Марка / Модел">
          <Mark n={3}>BMW 320D</Mark>
        </Line>
        <Line label="(4) Километропоказател">
          <Mark n={4}>184 312 km</Mark>
        </Line>
        <Line label="Първа регистрация">14.03.2016 г.</Line>
        <Line label="Вид на двигателя">ДИЗЕЛ</Line>
      </div>

      <p className="mx-auto mt-5 max-w-[34ch] text-center font-body text-[11px] font-bold uppercase leading-snug sm:text-[12px]">
        (7) Техническата изправност на ППС допуска да се движи по пътищата
      </p>

      <div className="mt-5 space-y-1.5 font-body text-[11.5px] sm:text-[12.5px]">
        <Line label="(3) Прегледът е извършен на">03.03.2026 г.</Line>
        <Line label="(8) Подлежи на преглед до">
          <Mark n={5}>03.03.2027 г. включително</Mark>
        </Line>
      </div>
    </figure>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="leading-snug">
      <span className="opacity-80">{label}: </span>
      <span className="font-bold">{children}</span>
    </p>
  );
}

/** A field the app reads, numbered to match the list beside the certificate. */
function Mark({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="relative whitespace-nowrap bg-[linear-gradient(transparent_58%,rgba(196,149,76,0.38)_58%)] px-0.5">
      {children}
      <sup className="ml-0.5 font-mono text-[9px] font-bold text-paper-copper">{n}</sup>
    </span>
  );
}

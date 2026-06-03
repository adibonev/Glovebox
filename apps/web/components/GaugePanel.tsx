"use client";

import { motion } from "framer-motion";

import type { Counts, GaugeView } from "@/app/_lib/dashboard";

const R = 80;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // a 270° gauge, open at the bottom

/** Glass panel: the instrument gauge for the nearest deadline + the three status counts. */
export function GaugePanel({ urgent, counts }: { urgent: GaugeView | null; counts: Counts }) {
  return (
    <div className="flex flex-col rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Най-близък срок</p>

      {urgent ? <Gauge urgent={urgent} /> : <AllClear />}

      <div className="my-4 h-px bg-white/[0.06]" />

      <div className="grid grid-cols-3 gap-2">
        <Stat n={counts.valid} label="в сила" tone="valid" />
        <Stat n={counts.expiring} label="изтичат" tone="expiring" />
        <Stat n={counts.expired} label="изтекли" tone="expired" />
      </div>
    </div>
  );
}

function Gauge({ urgent }: { urgent: GaugeView }) {
  const frac = Math.max(0, Math.min(1, urgent.fraction));
  const expired = urgent.days < 0;
  // Overdue → show a full (alarming) ring rather than an empty one.
  const displayFrac = expired ? 1 : frac;

  return (
    <div className="relative mx-auto my-3 h-[212px] w-[212px]">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${C}`}
          transform="rotate(135 100 100)"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={urgent.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${C}`}
          transform="rotate(135 100 100)"
          initial={{ strokeDashoffset: ARC }}
          animate={{ strokeDashoffset: ARC * (1 - displayFrac) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          style={{ filter: `drop-shadow(0 0 8px ${urgent.color}73)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-[62px] font-semibold leading-none"
          style={{ color: urgent.color }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {Math.abs(urgent.days)}
        </motion.span>
        <span
          className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.22em]"
          style={{ color: urgent.color }}
        >
          дни
        </span>
        <span className="mt-1.5 max-w-[160px] truncate px-2 text-center font-body text-[13px] text-muted">
          {expired ? `${urgent.typeLabel} изтече` : `до ${urgent.typeLabel}`}
        </span>
      </div>
    </div>
  );
}

function AllClear() {
  return (
    <div className="my-3 flex h-[212px] flex-col items-center justify-center gap-3 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full border border-status-valid/30 bg-status-valid/10">
        <svg
          viewBox="0 0 24 24"
          className="h-9 w-9 text-status-valid"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 L9 17 L4 12" />
        </svg>
      </div>
      <p className="font-body text-sm text-muted">Няма наближаващи срокове</p>
    </div>
  );
}

const TONE = {
  valid: { num: "text-ivory", dot: "bg-status-valid" },
  expiring: { num: "text-status-expiring", dot: "bg-status-expiring" },
  expired: { num: "text-status-expired", dot: "bg-status-expired" },
} as const;

function Stat({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: keyof typeof TONE;
}) {
  return (
    <div className="text-center">
      <div className={`font-display text-[26px] font-semibold leading-none ${TONE[tone].num}`}>{n}</div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 font-body text-[11px] text-muted">
        <span className={`h-[7px] w-[7px] rounded-full ${TONE[tone].dot}`} />
        {label}
      </div>
    </div>
  );
}

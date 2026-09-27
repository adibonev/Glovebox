"use client";

import { motion } from "framer-motion";

import type { Counts, GaugeView } from "@/app/_lib/dashboard";

const R = 80;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // a 270° gauge, open at the bottom

/**
 * Glass panel: the instrument gauge for the nearest deadline + the three status counts.
 *
 * `compact` is the dashboard's: a smaller gauge with the counts beside it on a phone, so the list
 * of deadlines starts on the first screen instead of two screens down.
 */
export function GaugePanel({
  urgent,
  counts,
  compact = false,
}: {
  urgent: GaugeView | null;
  counts: Counts;
  compact?: boolean;
}) {
  const stats = (
    <div className="grid grid-cols-3 gap-2">
      <Stat n={counts.valid} label="в сила" tone="valid" />
      <Stat n={counts.expiring} label="изтичат" tone="expiring" />
      <Stat n={counts.expired} label="изтекли" tone="expired" />
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-card border border-white/10 bg-gradient-to-b from-panel to-ink2 p-4 lg:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Най-близък срок</p>
        <div className="flex items-center gap-4 lg:flex-col lg:items-stretch">
          <div className="shrink-0">
            {urgent ? <Gauge urgent={urgent} size={150} /> : <AllClear size={150} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-4 hidden h-px bg-white/[0.06] lg:block" />
            {stats}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-card border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Най-близък срок</p>

      {urgent ? <Gauge urgent={urgent} /> : <AllClear />}

      <div className="my-4 h-px bg-white/[0.06]" />

      {stats}
    </div>
  );
}

function Gauge({ urgent, size = 212 }: { urgent: GaugeView; size?: number }) {
  const frac = Math.max(0, Math.min(1, urgent.fraction));
  const expired = urgent.days < 0;
  // Overdue → show a full (alarming) ring rather than an empty one.
  const displayFrac = expired ? 1 : frac;

  return (
    <div className="relative mx-auto my-3" style={{ width: size, height: size }}>
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
          className="font-brand font-semibold leading-none"
          style={{ color: urgent.color, fontSize: Math.round(size * 0.29) }}
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
        {/* The name on its own: "до Винетка" read as a misplaced capital. */}
        <span
          className="mt-1.5 line-clamp-2 px-2 text-center font-body text-[12.5px] leading-tight text-muted"
          style={{ maxWidth: size * 0.72 }}
        >
          {expired ? `${urgent.typeLabel} · изтече` : urgent.typeLabel}
        </span>
      </div>
    </div>
  );
}

function AllClear({ size = 212 }: { size?: number }) {
  return (
    <div className="my-3 flex flex-col items-center justify-center gap-3 text-center" style={{ height: size }}>
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
      <div className={`font-brand text-[26px] font-semibold leading-none ${TONE[tone].num}`}>{n}</div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 font-body text-[11px] text-muted">
        <span className={`h-[7px] w-[7px] rounded-full ${TONE[tone].dot}`} />
        {label}
      </div>
    </div>
  );
}

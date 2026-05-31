"use client";

import { motion } from "framer-motion";

const RADIUS = 86;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Instrument gauge for the most urgent obligation: a ring that fills to the time left. */
export function ExpiryGauge({
  days,
  fraction,
  color,
}: {
  days: number;
  fraction: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <div
        aria-hidden
        className="absolute h-40 w-40 rounded-full blur-2xl"
        style={{ backgroundColor: `${color}1f` }}
      />
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="rgba(207,210,203,0.10)"
          strokeWidth="9"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-7xl leading-none text-ivory"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {days}
        </motion.span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/55">
          дни
        </span>
      </div>
    </div>
  );
}

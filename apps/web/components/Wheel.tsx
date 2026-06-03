import type { CSSProperties } from "react";

/**
 * The Glovebox steering wheel — spokes at 9 / 3 / 6 o'clock (a real wheel, not the
 * top-pointing 3-spoke Mercedes star). Inherits `currentColor`; size via className or style.
 */
export function Wheel({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className} style={style}>
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" />
      <circle cx="32" cy="32" r="7" fill="currentColor" />
      {/* Three spokes at 9 / 3 / 6 o'clock — a real steering wheel (no top spoke). */}
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M9 32 L22 32" />
        <path d="M55 32 L42 32" />
        <path d="M32 55 L32 42" />
      </g>
    </svg>
  );
}

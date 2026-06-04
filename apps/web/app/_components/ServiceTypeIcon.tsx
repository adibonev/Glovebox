import type { ReactNode } from "react";

/**
 * Line icons per Service Type, drawn to match the cinematic brand (thin stroke,
 * inherits `currentColor` so callers tint them silver / copper / status).
 */
const ICONS: Record<string, ReactNode> = {
  // Гражданска отговорност — shield
  civil_liability: <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />,
  // Каско — umbrella (comprehensive cover)
  casco: (
    <>
      <path d="M3.5 12a8.5 8.5 0 0117 0z" />
      <path d="M12 12v5.5a2 2 0 01-4 0" />
      <path d="M12 4.5V3" />
    </>
  ),
  // Винетка — road
  vignette: (
    <>
      <path d="M9 3L5 21M15 3l4 18" />
      <path d="M12 5v2.5M12 11v2.5M12 17v2.5" />
    </>
  ),
  // Технически преглед — clipboard check
  inspection: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9.5 4V3h5v1" />
      <path d="M9 12.5l2 2 4-4" />
    </>
  ),
  // Данък МПС — banknote
  tax: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 9.5h.01M17.5 14.5h.01" />
    </>
  ),
  // Пожарогасител — extinguisher
  fire_extinguisher: (
    <>
      <rect x="9" y="8" width="6" height="13" rx="2.2" />
      <path d="M11 8V6a2 2 0 012-2h1.5" />
      <path d="M9 11H6" />
    </>
  ),
  // Обслужване — gear
  maintenance: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1L5.3 5.3" />
    </>
  ),
  // Ремонт — wrench (a dated expense, not an obligation)
  repair: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
};

export function ServiceTypeIcon({ type, className }: { type: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[type] ?? ICONS.maintenance}
    </svg>
  );
}

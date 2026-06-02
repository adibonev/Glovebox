/**
 * Glovebox shared design tokens — the single source of truth for the brand palette
 * and typography. Mirrors brand/BRAND.md (ADR-0005). Consumed by web (Tailwind) and,
 * later, mobile (NativeWind). Keep hex/font values here, never hard-coded in apps.
 */

/** Brand palette + the dark "scene" surfaces it sits on. */
export const colors = {
  ink: "#07100C",
  ink2: "#0A140F",
  panel: "#0C1813",
  panel2: "#0E1A14",
  glow: "#102017",
  emerald: "#14503A",
  copper: "#C4954C",
  silver: "#CFD2CB",
  ivory: "#F4F1EA",
  muted: "#9AA79C",
  dim: "#69736A",
} as const;

/** Functional Expiry Status colors (separate from the brand palette). */
export const statusColors = {
  valid: "#5FCF9A",
  expiring: "#E3A93A",
  expired: "#E0705C",
} as const;

/** Font families (loaded by each app's platform; names only here). */
export const fonts = {
  display: "Fraunces",
  body: "Hanken Grotesk",
  mono: "JetBrains Mono",
} as const;

export const tokens = {
  colors,
  statusColors,
  fonts,
} as const;

export type Colors = typeof colors;
export type StatusColors = typeof statusColors;
export type Fonts = typeof fonts;
export type Tokens = typeof tokens;

import type { Config } from "tailwindcss";

import { colors, statusColors } from "@glovebox/ui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Brand palette comes from the shared design tokens — never hard-coded here.
      colors: {
        ink: colors.ink,
        ink2: colors.ink2,
        panel: colors.panel,
        panel2: colors.panel2,
        glow: colors.glow,
        emerald: colors.emerald,
        copper: colors.copper,
        silver: colors.silver,
        ivory: colors.ivory,
        muted: colors.muted,
        dim: colors.dim,
        status: statusColors,
      },
      fontFamily: {
        // CSS variables come from next/font (see app/layout.tsx). Fraunces (Latin
        // display/numerals) and Hanken Grotesk (UI) have no Cyrillic, so Manrope
        // (--font-cyr) covers Bulgarian glyphs; JetBrains Mono ships Cyrillic.
        display: ["var(--font-display)", "var(--font-cyr)", "serif"],
        body: ["var(--font-body)", "var(--font-cyr)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

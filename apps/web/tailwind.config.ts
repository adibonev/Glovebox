import type { Config } from "tailwindcss";

import { colors, paper, radii, statusColors } from "@glovebox/ui";

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
        paper,
      },
      borderRadius: radii,
      fontFamily: {
        // CSS variables come from next/font (see app/layout.tsx). Sofia Sans Condensed for
        // headings, Sofia Sans for text, JetBrains Mono for plates and dates. `brand` is
        // Fraunces, which has no Cyrillic: only the wordmark and bare figures may use it.
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        brand: ["var(--font-brand)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

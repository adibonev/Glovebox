import type { Config } from "tailwindcss";

import { colors, statusColors, fonts } from "@glovebox/ui";

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
        emerald: colors.emerald,
        copper: colors.copper,
        silver: colors.silver,
        ivory: colors.ivory,
        status: statusColors,
      },
      fontFamily: {
        display: [fonts.display, "serif"],
        body: [fonts.body, "sans-serif"],
        mono: [fonts.mono, "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

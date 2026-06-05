// Brand palette comes from the shared design tokens (@glovebox/ui) — never hard-coded.
// Same token seam as the web Tailwind config; loaded via jiti (TS source is fine).
const { colors, statusColors } = require("@glovebox/ui");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
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
        // Fraunces (loaded in app/_layout) for the wordmark + numerals. Latin-only — never
        // apply to Bulgarian text (it would tofu); UI body stays the system font.
        display: ["Fraunces_600SemiBold"],
      },
    },
  },
  plugins: [],
};

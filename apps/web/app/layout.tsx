import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

// Fraunces — display/numerals/logo; Hanken Grotesk — UI body; JetBrains Mono — labels.
// Manrope carries the Cyrillic glyphs Fraunces/Hanken lack. Exposed as CSS variables.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-cyr", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glovebox — Табло на автомобила",
  description: "Следете документите и сроковете на автомобила си.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="bg"
      className={`${fraunces.variable} ${hanken.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="bg-ink font-body text-ivory antialiased">{children}</body>
    </html>
  );
}

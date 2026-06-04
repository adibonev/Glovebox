import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";
import type { ReactNode } from "react";

import { CookieConsent } from "@/components/CookieConsent";
import { PostHogProvider } from "@/components/PostHogProvider";

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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const title = "Glovebox — Следи сроковете на колата си";
const description =
  "Гражданска отговорност, Каско, Винетка, Технически преглед, Данък и още — на едно място, с напомняния преди да изтекат.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Glovebox",
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Glovebox",
    type: "website",
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="bg"
      className={`${fraunces.variable} ${hanken.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="bg-ink font-body text-ivory antialiased">
        <PostHogProvider>
          {children}
          <CookieConsent />
        </PostHogProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import {
  Fraunces,
  JetBrains_Mono,
  Sofia_Sans,
  Sofia_Sans_Condensed,
} from "next/font/google";
import type { ReactNode } from "react";

import { CookieConsent } from "@/components/CookieConsent";
import { MetaPixel } from "@/components/MetaPixel";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SITE_URL } from "@/lib/site";

import "./globals.css";

// Sofia Sans is by Lettersoup, a Bulgarian studio, and its plain Cyrillic *is* the Bulgarian
// alphabet (the Russian letterforms are the alternates), so д, л and ж come out the way they are
// written here. Condensed for headings, regular for text, JetBrains Mono for plates and dates.
const sofiaCondensed = Sofia_Sans_Condensed({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});
const sofia = Sofia_Sans({ subsets: ["latin", "cyrillic"], variable: "--font-body", display: "swap" });
// Fraunces has no Cyrillic, so it only sets the wordmark and bare figures. Its metric-matched
// fallback is Times New Roman, which *does* have Cyrillic: left on, it quietly set every
// Bulgarian heading in Times before any other font in the stack was asked.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
  adjustFontFallback: false,
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = SITE_URL;

const title = "Glovebox — Следи сроковете на колата си";
const description =
  "Гражданска отговорност, Каско, Винетка, Технически преглед и Данък МПС. Снимаш талона, а Glovebox ти напомня преди всеки срок.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Glovebox",
  // Apple's own smart banner: iOS Safari offers the app at the top of the page, with no UI of ours.
  itunes: { appId: "6806023587" },
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
      className={`${sofiaCondensed.variable} ${sofia.variable} ${fraunces.variable} ${jetbrains.variable}`}
    >
      <body className="bg-ink font-body text-ivory antialiased">
        <PostHogProvider>
          {children}
          <CookieConsent />
          <MetaPixel />
        </PostHogProvider>
      </body>
    </html>
  );
}

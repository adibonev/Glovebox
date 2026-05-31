import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Glovebox — Табло на колата",
  description: "Следете документите и сроковете на автомобила си.",
};

// Fraunces (Latin display/numerals), Manrope (Cyrillic body), JetBrains Mono (labels).
// Loaded via the browser so the dev server has no build-time network dependency.
const fontsHref =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body className="bg-ink text-ivory font-body antialiased">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={fontsHref} />
        {children}
      </body>
    </html>
  );
}

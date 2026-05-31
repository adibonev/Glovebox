import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Glovebox",
  description: "Дигиталната жабка за документите и сроковете на автомобила ви.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body className="bg-ink text-ivory font-body antialiased">{children}</body>
    </html>
  );
}

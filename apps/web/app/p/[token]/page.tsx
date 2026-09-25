import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { passportByToken } from "../../_lib/passport";

import { PassportSheet } from "./PassportSheet";

// A passport is read by whoever holds the link, not found by searching.
export const metadata: Metadata = {
  title: "Паспорт на автомобил · Glovebox",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The passport a Passport Link opens, printed on paper because it stands in for one.
 *
 * Read live on every visit. That is what makes it checkable: the PDF a seller hands over carries
 * a QR code to this page, and anything edited in the PDF will not match what is shown here.
 */
export default async function PassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loaded = await passportByToken(token);
  if (!loaded) notFound();
  return <PassportSheet passport={loaded.passport} pdfHref={`/p/${token}/pdf`} />;
}

import { paper } from "@glovebox/ui";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { passportByToken, passportUrl } from "../../../_lib/passport";

import { PassportDocument } from "./PassportDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The passport as a PDF, for the seller to send or print. Built on request from the live data,
 * with a QR code back to the page it came from: a buyer scans it and sees the same numbers, or
 * sees that they differ.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loaded = await passportByToken(token);
  if (!loaded) return new Response("Няма такъв паспорт.", { status: 404 });

  const url = passportUrl(token);
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 0,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: paper.ink, light: paper.raised },
  });

  const { vehicle } = loaded.passport;
  const pdf = await renderToBuffer(PassportDocument({ passport: loaded.passport, qrDataUrl, url }));
  const name = `pasport-${(vehicle.plate ?? `${vehicle.brand}-${vehicle.model}`).replace(/[^\p{L}\p{N}-]+/gu, "-")}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // Opened in the browser (and in the phone's viewer, which has its own share button),
      // with a sensible name when saved.
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

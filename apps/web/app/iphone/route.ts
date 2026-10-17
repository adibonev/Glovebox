import { NextResponse } from "next/server";

import { storeHandoffHtml } from "@/lib/storeRedirect";

/**
 * glovebox.bg/iphone — the link for ads. Meta does not accept an App Store URL in a Traffic
 * campaign, so the ad points here. Everyone gets a small page that, on an iPhone, hands over to
 * the App Store (a bare redirect leaves Facebook's in-app browser blank) and sends anyone else to
 * the landing page.
 * The middleware still runs first, so utm_* labels on the link are remembered as usual.
 */
export function GET() {
  return new NextResponse(storeHandoffHtml(), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

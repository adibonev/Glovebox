import { NextResponse, type NextRequest } from "next/server";

import { isAppleMobile, storeHandoffHtml } from "@/lib/storeRedirect";

/**
 * glovebox.bg/iphone — the link for ads. Meta does not accept an App Store URL in a Traffic
 * campaign, so the ad points here. An iPhone gets a small page that hands over to the App Store
 * (a bare redirect leaves Facebook's in-app browser blank); anyone else goes to the landing page.
 * The middleware still runs first, so utm_* labels on the link are remembered as usual.
 */
export function GET(request: NextRequest) {
  if (!isAppleMobile(request.headers.get("user-agent"))) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
  return new NextResponse(storeHandoffHtml(), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

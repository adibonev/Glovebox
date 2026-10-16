import { NextResponse, type NextRequest } from "next/server";

import { storeRedirectFor } from "@/lib/storeRedirect";

/**
 * glovebox.bg/iphone — the link for ads. Meta does not accept an App Store URL in a Traffic
 * campaign, so the ad points here and an iPhone is sent on to the App Store at once. The
 * middleware still runs first, so utm_* labels on the link are remembered as usual.
 */
export function GET(request: NextRequest) {
  const target = storeRedirectFor(request.headers.get("user-agent"));
  return NextResponse.redirect(new URL(target, request.url), 302);
}

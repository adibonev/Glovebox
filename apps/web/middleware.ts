import { readCampaign } from "@glovebox/core/campaign";
import { normalizeReferralCode } from "@glovebox/core/referral";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { CAMPAIGN_COOKIE, CAMPAIGN_COOKIE_MAX_AGE } from "@/lib/campaign";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/invite";

/**
 * On every request: refresh the Supabase session cookie, serve the prebuilt landing page to
 * visitors with no session, and remember an invite or campaign the visitor arrived with.
 */
export async function middleware(request: NextRequest) {
  // No session at all: "/" is the landing page, which is prebuilt. Serving it straight away
  // skips both the auth round trip and the loading screen a dynamic "/" shows while it runs.
  if (request.nextUrl.pathname === "/" && !hasSessionCookie(request)) {
    const landing = request.nextUrl.clone();
    landing.pathname = "/start";
    return rememberArrival(request, NextResponse.rewrite(landing));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return rememberArrival(request, response);
}

/**
 * Supabase keeps the session in `sb-<project>-auth-token`, split into `.0`, `.1` … when large.
 * The PKCE verifier cookie shares the prefix but is not a session.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(\.\d+)?$/.test(name));
}

const COOKIE = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * Cookies for what the visitor arrived with, claimed onto their account once they sign up:
 * an invite link's code (/i/K7Q2MX), and the labels of the first tagged campaign link.
 */
function rememberArrival(request: NextRequest, response: NextResponse): NextResponse {
  const invite = /^\/i\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  const code = invite ? normalizeReferralCode(safeDecode(invite[1] ?? "")) : null;
  if (code) response.cookies.set(INVITE_COOKIE, code, { ...COOKIE, maxAge: INVITE_COOKIE_MAX_AGE });

  if (!request.cookies.has(CAMPAIGN_COOKIE)) {
    const campaign = readCampaign(request.nextUrl.searchParams, request.nextUrl.pathname, new Date());
    if (campaign) {
      response.cookies.set(CAMPAIGN_COOKIE, JSON.stringify(campaign), {
        ...COOKIE,
        maxAge: CAMPAIGN_COOKIE_MAX_AGE,
      });
    }
  }
  return response;
}

/** A malformed escape in someone's pasted link must not take the whole request down. */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

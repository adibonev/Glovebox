import { normalizeReferralCode } from "@glovebox/core/referral";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/invite";

/** Refresh the Supabase session cookie on every request (Next.js + @supabase/ssr). */
export async function middleware(request: NextRequest) {
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

  // An invite link (/i/K7Q2MX) remembers its code, so the account made after it knows who sent it.
  const invite = /^\/i\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  const code = invite ? normalizeReferralCode(safeDecode(invite[1] ?? "")) : null;
  if (code) {
    response.cookies.set(INVITE_COOKIE, code, {
      maxAge: INVITE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
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

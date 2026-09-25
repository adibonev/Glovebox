import { SupabaseUserRepository, SupabaseVehicleSharingRepository } from "@glovebox/core";
import { NextResponse } from "next/server";

import { SHARE_COOKIE, SHARE_COOKIE_MAX_AGE } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";

const TOKEN = /^[0-9a-f]{32}$/;

/**
 * An owner's car invitation, opened on the web (the app opens it itself when installed).
 * Signed in: joined on the spot, and on to the garage. Not yet: the invitation is kept in a cookie
 * and joined right after sign-up or sign-in (claimArrival).
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  if (!TOKEN.test(token)) return NextResponse.redirect(new URL("/vehicles?share=invalid", origin));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.redirect(new URL("/login?mode=signup", origin));
    response.cookies.set(SHARE_COOKIE, token, {
      maxAge: SHARE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  await new SupabaseUserRepository(supabase).findOrCreateByAuthId({ authUserId: user.id, email: user.email ?? "" });
  const joined = await new SupabaseVehicleSharingRepository(supabase).join(token).catch(() => null);
  return NextResponse.redirect(new URL(joined ? "/vehicles?share=joined" : "/vehicles?share=invalid", origin));
}

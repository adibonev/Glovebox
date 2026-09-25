"use client";

import { useEffect } from "react";

import { claimInvite } from "@/app/_lib/invite";

/**
 * Rendered by the signed-in page chrome only while an invite code is waiting. It hands the code
 * to the server once; a server component cannot clear a cookie, a server action can.
 */
export function InviteClaim() {
  useEffect(() => {
    void claimInvite();
  }, []);
  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { claimArrival } from "@/app/_lib/arrival";

/**
 * Rendered by the signed-in page chrome only while an invite code or a campaign is waiting to be
 * written onto the account. It hands them to the server once: a server component cannot clear a
 * cookie, a server action can.
 */
export function ArrivalClaim() {
  const router = useRouter();
  useEffect(() => {
    // A car joined in the background belongs on the page the User is looking at.
    void claimArrival().then(({ joinedCar }) => joinedCar && router.refresh());
  }, [router]);
  return null;
}

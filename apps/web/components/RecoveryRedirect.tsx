"use client";

import { useEffect } from "react";

/**
 * A "Нова парола" link that lands anywhere but /auth/reset goes on there, session and all.
 *
 * Supabase sends people to the address the reset asked for only if it is on the project's list
 * of allowed redirects; otherwise to the Site URL, the home page, where nothing reads the
 * fragment and the link would look dead.
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname !== "/auth/reset" && /(^#|&)type=recovery(&|$)/.test(hash)) {
      window.location.replace(`/auth/reset${hash}`);
    }
  }, []);
  return null;
}

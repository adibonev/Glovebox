import * as Linking from "expo-linking";
import { useEffect } from "react";

import { supabase } from "./supabase";

/**
 * Turns an auth deep link into a session.
 *
 * Supabase e-mail links (sign-up confirmation, password recovery) send the User back to
 * `glovebox://auth-callback?code=…`. Nothing else in the app listens for an incoming URL —
 * the Google flow reads its redirect straight off the browser session it opened — so without
 * this the link opened the app and the code was dropped on the floor, leaving the User staring
 * at the login screen after they had just confirmed their address.
 *
 * Handles both entry points: a cold start (the app was not running when the link was tapped)
 * and a warm one (it was already open).
 */

/** Codes are single-use; the OAuth flow may also surface the same URL here. */
let lastHandled: string | null = null;

async function exchange(url: string | null): Promise<void> {
  if (!url) return;

  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (code) {
    if (code === lastHandled) return;
    lastHandled = code;
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }

  // Recovery and older confirmation links carry the tokens in the fragment instead.
  const fragment = url.split("#")[1];
  if (!fragment) return;
  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    if (accessToken === lastHandled) return;
    lastHandled = accessToken;
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }
}

/** Mount once, inside the auth provider — the session listener reacts to what this sets. */
export function useAuthDeepLink(): void {
  useEffect(() => {
    // Best-effort throughout: a malformed or already-used link must never crash the app.
    void Linking.getInitialURL()
      .then(exchange)
      .catch(() => {});

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void exchange(url).catch(() => {});
    });
    return () => subscription.remove();
  }, []);
}

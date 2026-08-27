import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "./supabase";

// Lets the auth browser tab dismiss itself and hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google";

/**
 * Sign in with a social provider via the system browser (PKCE). Supabase returns an auth URL we
 * open; on success the redirect deep-links back to the app with a `code` we exchange for a session.
 * Works in Expo Go and dev/standalone builds — the redirect URL adapts to the runtime, so the same
 * value must be allow-listed in Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const redirectTo = Linking.createURL("auth-callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Неуспешно стартиране на входа.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return; // user dismissed the browser

  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (!code) throw new Error("Входът не върна код за оторизация.");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  // The auth gate (RootNavigator) reacts to the new session and routes into the app.
}

/**
 * Native "Sign in with Apple" (iOS only). Apple returns a signed identity token which we hand
 * directly to Supabase via `signInWithIdToken` — no browser or redirect (unlike Google). Apple
 * requires this whenever another social login is offered on iOS (App Store Guideline 4.8). The
 * Apple provider must be enabled in Supabase → Authentication → Providers with this app's bundle
 * id (`bg.glovebox.app`) in the authorized client ids.
 */
export async function signInWithApple(): Promise<void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    // The user dismissed the Apple sheet — mirror the Google "browser dismissed" no-op.
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
    throw e;
  }

  if (!credential.identityToken) throw new Error("Apple не върна identity token.");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
  // The auth gate (RootNavigator) reacts to the new session and routes into the app.
}

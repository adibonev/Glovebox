"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/** The OAuth client Supabase already uses for Google; public by nature (it is in every sign-in URL). */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleIdentity = {
  initialize(config: {
    client_id: string;
    nonce: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

/**
 * A nonce for the ID token: Google gets its SHA-256, Supabase the original, and a token lifted
 * from somewhere else fails the match.
 */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/**
 * Sign in with Google's own button (Google Identity Services), then hand its ID token to Supabase.
 *
 * The redirect flow went through Supabase's domain, and Google's account chooser said "continue to
 * xclqfebkmebageqnamvp.supabase.co". Here Google talks to this page, so it names glovebox.bg. Needs
 * the site listed under Authorized JavaScript origins of the OAuth client (docs/DEPLOY.md, step 4);
 * until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set the login page keeps the redirect flow.
 */
export function GoogleSignIn({ onError }: { onError: () => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  // Held in a ref: the page passes a new function each render, and the button must not be rebuilt
  // on every keystroke in the e-mail field.
  const reportError = useRef(onError);
  reportError.current = onError;

  useEffect(() => {
    const parent = slot.current;
    if (!loaded || !GOOGLE_CLIENT_ID || !parent || !window.google) return;
    let cancelled = false;

    void makeNonce().then(({ raw, hashed }) => {
      if (cancelled || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        callback: async ({ credential }) => {
          const { error } = await createClient().auth.signInWithIdToken({
            provider: "google",
            token: credential,
            nonce: raw,
          });
          // A full load, so the server renders the dashboard with the new session cookie.
          if (error) reportError.current();
          else window.location.assign("/");
        },
      });
      window.google.accounts.id.renderButton(parent, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        logo_alignment: "center",
        locale: "bg",
        width: Math.min(400, Math.max(200, parent.clientWidth)),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [loaded]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <div ref={slot} className="flex min-h-[44px] w-full justify-center" />
    </>
  );
}

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";
import { clearDeadlines } from "./widget";

type AuthState = {
  session: Session | null;
  /** True until the persisted session has been resolved on launch. */
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

/** Resolves the persisted session and keeps it in sync via Supabase auth events. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Signing out and deleting the account both end here; the lock screen must not keep
      // showing someone's deadlines after either.
      if (event === "SIGNED_OUT") clearDeadlines();
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signOut() {
  await supabase.auth.signOut();
}

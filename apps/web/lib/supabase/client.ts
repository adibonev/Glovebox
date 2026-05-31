import type { Database } from "@glovebox/core";
import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for browser (Client Component) use. RLS scopes data to the signed-in user. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

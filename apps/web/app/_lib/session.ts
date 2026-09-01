import { cache } from "react";

import { SupabaseUserRepository, type User } from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in User, resolved once per request.
 *
 * Every page previously re-asked Supabase for the Auth Identity and the `users` row — the
 * page shell and the page body each paying a full round trip. `cache()` collapses those to
 * one call per request, which is the difference between ~6 and ~4 hops on the dashboard.
 */

/** The Supabase Auth Identity backing this request, or `null` when signed out. */
export const currentAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Resolve (and provision on first sight) the app User for this request's Auth Identity. */
export const currentUser = cache(async (): Promise<User | null> => {
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const repo = new SupabaseUserRepository(supabase);
  return (
    await repo.findOrCreateByAuthId({ authUserId: authUser.id, email: authUser.email ?? "" })
  );
});

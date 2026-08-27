import { SITE_URL } from "./config";
import { supabase } from "./supabase";

/** The User's display name (`users.name`). RLS scopes to the owner. */
export async function getName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", Number(userId))
    .maybeSingle();
  return data?.name ?? "";
}

export async function updateName(userId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ name: name.trim() || null })
    .eq("id", Number(userId));
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

/**
 * Delete the User's account and all of their data, permanently (GDPR Art. 17; required
 * in-app by App Store Guideline 5.1.1(v)). The purge itself runs server-side — deleting an
 * Auth Identity needs the service-role key, which must never be in the app bundle.
 */
export async function deleteAccount(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Няма активна сесия.");

  const response = await fetch(`${SITE_URL}/api/account/delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error("Изтриването не успя. Опитай пак след малко.");

  // The Auth Identity no longer exists, so a server sign-out would just fail — clear the
  // stored session locally, which flips the auth listener back to the login screen.
  await supabase.auth.signOut({ scope: "local" });
}

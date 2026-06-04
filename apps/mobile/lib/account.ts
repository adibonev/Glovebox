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

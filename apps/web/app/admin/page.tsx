import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { AdminView } from "./AdminView";

export const metadata = { title: "Glovebox — Админ" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; email?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only Administrators (is_admin) may see this page.
  const admin = createAdminClient();
  const { data: me } = await admin
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!me?.is_admin) redirect("/");

  const sp = await searchParams;
  return (
    <Shell email={user.email ?? ""}>
      <AdminView ok={sp.ok} error={sp.error} email={sp.email} />
    </Shell>
  );
}

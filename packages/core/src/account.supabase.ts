import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountPurge } from "./account";
import type { Database } from "./database.types";

/** Storage `remove` takes a batch of paths; keep the batches small enough to be safe. */
const REMOVE_BATCH = 100;
/** `uid/serviceId/file` is 2 levels — a small cap keeps an odd bucket layout from looping. */
const MAX_SWEEP_DEPTH = 3;

/**
 * The Supabase adapter for the account-purge seam (see `account.ts`).
 *
 * SERVER-ONLY: it needs a **service-role** client. Deleting an Auth Identity is an admin
 * operation, and RLS is no help once the rows are being erased on the User's behalf.
 */
export class SupabaseAccountPurge implements AccountPurge {
  constructor(
    private readonly admin: SupabaseClient<Database>,
    private readonly bucket = "documents",
  ) {}

  async documentPaths(authUserId: string): Promise<string[]> {
    const paths = new Set<string>();

    const { data: user } = await this.admin
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (user) {
      const { data, error } = await this.admin
        .from("documents")
        .select("path")
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) paths.add(row.path);
    }

    // Also sweep the User's Storage prefix: an upload whose `documents` row never landed
    // leaves a file no table knows about, and it is still the User's data.
    for (const path of await this.sweep(authUserId)) paths.add(path);

    return [...paths];
  }

  async removeFiles(paths: string[]): Promise<void> {
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const { error } = await this.admin.storage
        .from(this.bucket)
        .remove(paths.slice(i, i + REMOVE_BATCH));
      if (error) throw new Error(error.message);
    }
  }

  async deleteAuthIdentity(authUserId: string): Promise<void> {
    const { error } = await this.admin.auth.admin.deleteUser(authUserId);
    if (error) throw new Error(error.message);
  }

  /** Every object under a Storage prefix. Entries with a null `id` are folders. */
  private async sweep(prefix: string, depth = 0): Promise<string[]> {
    if (depth >= MAX_SWEEP_DEPTH) return [];
    const { data, error } = await this.admin.storage.from(this.bucket).list(prefix, { limit: 1000 });
    if (error || !data) return [];

    const found: string[] = [];
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) found.push(...(await this.sweep(path, depth + 1)));
      else found.push(path);
    }
    return found;
  }
}

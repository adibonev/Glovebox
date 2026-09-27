import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import type { RecordErasure } from "./erasure";

/** Storage `remove` takes a batch of paths; keep the batches small enough to be safe. */
const REMOVE_BATCH = 100;

/**
 * The Supabase adapter for the erasure seam (see `erasure.ts`).
 *
 * Runs as the signed-in User: RLS lets the owner and the car's members read the Documents of its
 * Service Records and delete their files (`readable_document_paths`), for as long as the rows exist,
 * which is why the files go first. It does NOT check who may delete a car or a record: an
 * Administrator's policies reach every row, so the caller checks ownership before calling.
 */
export class SupabaseRecordErasure implements RecordErasure {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly bucket = "documents",
  ) {}

  async serviceRecordIds(vehicleId: string): Promise<string[]> {
    const { data, error } = await this.client.from("services").select("id").eq("car_id", Number(vehicleId));
    if (error) throw new Error(`Supabase services.ids failed: ${error.message}`);
    return (data ?? []).map((row) => String(row.id));
  }

  async documentPaths(serviceRecordIds: string[]): Promise<string[]> {
    const { data, error } = await this.client
      .from("documents")
      .select("path")
      .in("service_id", serviceRecordIds.map(Number));
    if (error) throw new Error(`Supabase documents.paths failed: ${error.message}`);
    return (data ?? []).map((row) => row.path);
  }

  async removeFiles(paths: string[]): Promise<void> {
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const { error } = await this.client.storage.from(this.bucket).remove(paths.slice(i, i + REMOVE_BATCH));
      if (error) throw new Error(`Supabase storage.remove failed: ${error.message}`);
    }
  }

  async deleteServiceRecord(id: string): Promise<void> {
    const { error } = await this.client.from("services").delete().eq("id", Number(id));
    if (error) throw new Error(`Supabase services.delete failed: ${error.message}`);
  }

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await this.client.from("cars").delete().eq("id", Number(id));
    if (error) throw new Error(`Supabase cars.delete failed: ${error.message}`);
  }
}

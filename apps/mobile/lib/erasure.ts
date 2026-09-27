import { SupabaseRecordErasure, eraseServiceRecord, eraseVehicle } from "@glovebox/core";

import { dataChanged } from "./freshness";
import { supabase } from "./supabase";

/**
 * Deleting a Service Record or a Vehicle together with the files of its Documents (core
 * `erasure.ts`). Deleting only the row left the photos of policies and certificates in Storage.
 */
const erasure = new SupabaseRecordErasure(supabase);

export async function deleteServiceRecord(id: string): Promise<void> {
  await eraseServiceRecord(erasure, id);
  dataChanged();
}

export async function deleteVehicle(id: string): Promise<void> {
  await eraseVehicle(erasure, id);
  dataChanged();
}

/** What a failed deletion tells the User: nothing was removed, and trying again is safe. */
export const DELETE_FAILED = "Не се изтри. Провери връзката и опитай пак.";

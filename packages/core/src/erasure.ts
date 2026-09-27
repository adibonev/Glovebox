/**
 * Deleting a Service Record or a Vehicle, and the files of its Documents with it.
 *
 * The rule is the one `account.ts` owns for a whole account: FILES FIRST. Deleting the row cascades
 * away the `documents` rows, and those are the only record of where the files live in Storage;
 * delete them first and the photos of a policy or a registration certificate stay in the bucket
 * for good, after the User deleted them. That is how two files already outlived their records.
 *
 * If Storage refuses, the record stays: a retry then still knows what to remove.
 */

/** The seam over the infrastructure the two deletions need (Storage + the rows). */
export type RecordErasure = {
  /** Every Service Record on a Vehicle, whatever its type or date. */
  serviceRecordIds(vehicleId: string): Promise<string[]>;
  /** Bucket-relative Storage paths of the Documents on these Service Records. */
  documentPaths(serviceRecordIds: string[]): Promise<string[]>;
  /** Remove those objects from Storage. */
  removeFiles(paths: string[]): Promise<void>;
  /** Delete the Service Record; its Documents' rows cascade. */
  deleteServiceRecord(id: string): Promise<void>;
  /** Delete the Vehicle; its Service Records and their Documents' rows cascade. */
  deleteVehicle(id: string): Promise<void>;
};

/** Delete a Service Record: the files of its Documents, then the record. */
export async function eraseServiceRecord(erasure: RecordErasure, serviceRecordId: string): Promise<void> {
  const paths = await erasure.documentPaths([serviceRecordId]);
  if (paths.length > 0) await erasure.removeFiles(paths);
  await erasure.deleteServiceRecord(serviceRecordId);
}

/** Delete a Vehicle: the files of every Document on it, then the Vehicle. */
export async function eraseVehicle(erasure: RecordErasure, vehicleId: string): Promise<void> {
  const records = await erasure.serviceRecordIds(vehicleId);
  const paths = records.length > 0 ? await erasure.documentPaths(records) : [];
  if (paths.length > 0) await erasure.removeFiles(paths);
  await erasure.deleteVehicle(vehicleId);
}

/**
 * Account deletion — the User's right to erasure (GDPR Art. 17) and Apple's App Store
 * Guideline 5.1.1(v): an app that lets a User create an account must let them delete it
 * from inside the app.
 *
 * The rule this module owns is ORDERING. Deleting the Auth Identity cascades away every
 * `public` row the User owns (users → cars/services/documents/... ON DELETE CASCADE), and
 * the `documents` rows are the only record of where the User's files live in Storage. So
 * the files must go FIRST — delete the Auth Identity first and the files are orphaned in
 * the bucket forever, which is exactly the data the User asked us to erase.
 *
 * If Storage removal fails we stop and leave the account intact: a retry then still knows
 * what to erase. A half-purge that keeps the files but drops the account is not retryable.
 */

/** The seam over the infrastructure a purge needs (Storage + the Auth admin API). */
export type AccountPurge = {
  /** Bucket-relative Storage paths of every file the User owns. */
  documentPaths(authUserId: string): Promise<string[]>;
  /** Remove those objects from Storage. */
  removeFiles(paths: string[]): Promise<void>;
  /** Delete the Auth Identity; cascades every row the User owns. */
  deleteAuthIdentity(authUserId: string): Promise<void>;
};

/** Erase a User: their Storage objects first, then the Auth Identity (which cascades). */
export async function purgeAccount(purge: AccountPurge, authUserId: string): Promise<void> {
  const paths = await purge.documentPaths(authUserId);
  if (paths.length > 0) await purge.removeFiles(paths);
  await purge.deleteAuthIdentity(authUserId);
}

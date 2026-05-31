/**
 * Core domain types (UBIQUITOUS_LANGUAGE.md).
 *
 * A User owns Vehicles; a Vehicle has Service Records; a Service Record has a
 * Service Type and an Expiry Date.
 */

/**
 * A motor vehicle owned by a User.
 *
 * Maps to the physical `cars` table at the Supabase repository seam — the domain
 * term is Vehicle, the table stays `cars` (ADR-0006). No Supabase here.
 */
export interface Vehicle {
  id: string;
  /** The User who owns this Vehicle (`cars.user_id` in the schema). */
  userId: string;
}

/** A single tracked obligation for a Vehicle, with one Service Type and an Expiry Date. */
export interface ServiceRecord {
  id: string;
  /** The Vehicle this record belongs to. */
  vehicleId: string;
  serviceType: string;
  expiryDate: Date;
}

/** The authenticated person who owns Vehicles; bridges the Supabase Auth Identity. */
export interface User {
  id: string;
  /** The Supabase auth identity id (`auth.users.id` = `users.auth_user_id`). */
  authUserId: string;
  email: string;
}

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
  /** Make, e.g. "BMW" (`cars.brand`). */
  brand: string;
  /** Model, e.g. "320d" (`cars.model`). */
  model: string;
  /** Model year, when known (`cars.year`). */
  year: number | null;
  /** Registration plate, when known (`cars.license_plate`). */
  plate: string | null;
}

/** A single tracked obligation for a Vehicle, with one Service Type and an Expiry Date. */
export interface ServiceRecord {
  id: string;
  /** The Vehicle this record belongs to. */
  vehicleId: string;
  serviceType: string;
  expiryDate: Date;
}

/** A user-uploaded file (PDF or image) attached to a Service Record. */
export interface Document {
  id: string;
  /** The Service Record this Document is attached to. */
  serviceRecordId: string;
  /** Object path in the private `documents` storage bucket. */
  path: string;
  /** Original file name shown to the User. */
  name: string;
  mimeType: string | null;
  createdAt: Date | null;
}

/** The authenticated person who owns Vehicles; bridges the Supabase Auth Identity. */
export interface User {
  id: string;
  /** The Supabase auth identity id (`auth.users.id` = `users.auth_user_id`). */
  authUserId: string;
  email: string;
}

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
  /** Vehicle Identification Number, when known (`cars.vin`). */
  vin: string | null;
  /** Body type code driving the silhouette, when set (`cars.body_type`). */
  bodyType: string | null;
}

/**
 * A single tracked event for a Vehicle with one Service Type and a date.
 *
 * Two kinds: an **expiring obligation** (ГО, Каско, … — `expiryDate` is when it lapses)
 * and a **dated expense** (Repair — `expiryDate` is the day it happened; it never expires,
 * see {@link NON_EXPIRING_SERVICE_TYPES}). `cost` is the optional amount paid, in EUR.
 */
export interface ServiceRecord {
  id: string;
  /** The Vehicle this record belongs to. */
  vehicleId: string;
  serviceType: string;
  /** Expiry date for obligations; the expense date for non-expiring types. */
  expiryDate: Date;
  /** Amount paid for this Service Record, in EUR (`services.cost`), when recorded. */
  cost: number | null;
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
  /** An Administrator (`users.is_admin = true`) may view the admin panel. */
  isAdmin: boolean;
}

// --- Write inputs (used by the repository create/update seam) ---------------------

/** Fields to create a Vehicle (the `id` is assigned by the store). */
export interface NewVehicle {
  userId: string;
  brand: string;
  model: string;
  year?: number | null;
  plate?: string | null;
  vin?: string | null;
  bodyType?: string | null;
}

/** Editable Vehicle fields; an omitted key is left unchanged. */
export interface VehicleChanges {
  brand?: string;
  model?: string;
  year?: number | null;
  plate?: string | null;
  vin?: string | null;
  bodyType?: string | null;
}

/**
 * Fields to create a Service Record. `userId` is required because the physical
 * `services` table denormalises the owner (`services.user_id`) for RLS / queries.
 */
export interface NewServiceRecord {
  vehicleId: string;
  userId: string;
  serviceType: string;
  expiryDate: Date;
  cost?: number | null;
}

/** Editable Service Record fields; an omitted key is left unchanged. */
export interface ServiceRecordChanges {
  serviceType?: string;
  expiryDate?: Date;
  cost?: number | null;
}

/**
 * Fields to record a Document. The file bytes live in Supabase Storage (the `documents`
 * bucket) under `path`; this records the row. `userId` is the denormalised owner
 * (`documents.user_id`).
 */
export interface NewDocument {
  serviceRecordId: string;
  userId: string;
  path: string;
  name: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

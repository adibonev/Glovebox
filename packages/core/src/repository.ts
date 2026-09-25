import type {
  Document,
  MileageReading,
  NewDocument,
  NewMileageReading,
  NewPassportLink,
  NewServiceRecord,
  PassportLink,
  Renewal,
  NewVehicle,
  ServiceRecord,
  ServiceRecordChanges,
  User,
  Vehicle,
  VehicleChanges,
} from "./domain";

/**
 * Access to Vehicles (a seam, ARCHITECTURE.md). The production adapter is Supabase
 * (mapping `cars` → Vehicle, ADR-0006); tests use the in-memory adapter. Ownership on
 * writes is enforced by Supabase RLS (a User can only touch their own `cars`).
 */
export interface VehicleRepository {
  listByUser(userId: string): Promise<Vehicle[]>;
  getById(id: string): Promise<Vehicle | null>;
  create(input: NewVehicle): Promise<Vehicle>;
  update(id: string, changes: VehicleChanges): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}

/**
 * Access to Service Records. `listByUser` returns the records across all of the
 * User's Vehicles — a join the Supabase adapter performs over `cars`. Writes are
 * RLS-scoped to the owner.
 */
export interface ServiceRecordRepository {
  listByUser(userId: string): Promise<ServiceRecord[]>;
  listByVehicle(vehicleId: string): Promise<ServiceRecord[]>;
  getById(id: string): Promise<ServiceRecord | null>;
  create(input: NewServiceRecord): Promise<ServiceRecord>;
  update(id: string, changes: ServiceRecordChanges): Promise<ServiceRecord>;
  delete(id: string): Promise<void>;
}

/**
 * Access to Documents. `listByUser` returns the Documents across all of the User's
 * Service Records — a join the Supabase adapter performs via `services`/`cars`. The file
 * bytes live in Storage; this seam owns the `documents` table rows (RLS-scoped on writes).
 */
export interface DocumentRepository {
  listByUser(userId: string): Promise<Document[]>;
  listByServiceRecord(serviceRecordId: string): Promise<Document[]>;
  create(input: NewDocument): Promise<Document>;
  delete(id: string): Promise<void>;
}

/**
 * Access to Mileage Readings, oldest first. `record` keeps one reading per Vehicle per day:
 * scanning the same certificate twice must not count the same kilometres twice, and a correction
 * made that day replaces the reading rather than adding a second. Writes are RLS-scoped to the
 * owner.
 */
export interface MileageReadingRepository {
  listByVehicle(vehicleId: string): Promise<MileageReading[]>;
  listByUser(userId: string): Promise<MileageReading[]>;
  record(input: NewMileageReading): Promise<MileageReading>;
}

/**
 * The periods a Vehicle's obligations covered before each renewal, oldest first. Read-only: the
 * database writes them itself whenever an Expiry Date moves on (see the renewals migration).
 */
export interface RenewalRepository {
  listByVehicle(vehicleId: string): Promise<Renewal[]>;
}

/**
 * Passport Links. The owner creates and revokes them through RLS; `findActiveByToken` is how a
 * stranger's request is resolved, so on the server it runs with the service role, and with a
 * User's own client it only ever finds that User's links.
 */
export interface PassportLinkRepository {
  /** The Vehicle's link that still works, if there is one. */
  activeForVehicle(vehicleId: string): Promise<PassportLink | null>;
  /** The link a token opens, unless it has been revoked. */
  findActiveByToken(token: string): Promise<PassportLink | null>;
  create(input: NewPassportLink): Promise<PassportLink>;
  revoke(id: string): Promise<void>;
}

/**
 * Resolves a Supabase Auth Identity to the app's User and provisions the profile
 * row on first sign-in (the `cars.user_id` foreign key points at `users.id`).
 */
export interface UserRepository {
  findByAuthId(authUserId: string): Promise<User | null>;
  create(input: { authUserId: string; email: string }): Promise<User>;
  /**
   * The User for this Auth Identity, provisioning one if this is their first run.
   *
   * Prefer this over `findByAuthId() ?? create()` at call sites: several screens mount at
   * once, all of them find nothing, and all of them then insert — the losers of that race
   * hit the unique index on e-mail and blow up in the User's face. This absorbs the
   * conflict and returns whichever row won.
   */
  findOrCreateByAuthId(input: { authUserId: string; email: string }): Promise<User>;
}

import type {
  Document,
  NewDocument,
  NewServiceRecord,
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
 * Resolves a Supabase Auth Identity to the app's User and provisions the profile
 * row on first sign-in (the `cars.user_id` foreign key points at `users.id`).
 */
export interface UserRepository {
  findByAuthId(authUserId: string): Promise<User | null>;
  create(input: { authUserId: string; email: string }): Promise<User>;
}

import type { Document, ServiceRecord, User, Vehicle } from "./domain";

/**
 * Read access to Vehicles (a seam, ARCHITECTURE.md). The production adapter is
 * Supabase (mapping `cars` → Vehicle, ADR-0006); tests use the in-memory adapter.
 */
export interface VehicleRepository {
  listByUser(userId: string): Promise<Vehicle[]>;
}

/**
 * Read access to Service Records. `listByUser` returns the records across all of
 * the User's Vehicles — a join the Supabase adapter performs over `cars`.
 */
export interface ServiceRecordRepository {
  listByUser(userId: string): Promise<ServiceRecord[]>;
  listByVehicle(vehicleId: string): Promise<ServiceRecord[]>;
}

/**
 * Read access to Documents. `listByUser` returns the Documents across all of the
 * User's Service Records — a join the Supabase adapter performs via `services`/`cars`.
 */
export interface DocumentRepository {
  listByUser(userId: string): Promise<Document[]>;
}

/**
 * Resolves a Supabase Auth Identity to the app's User and provisions the profile
 * row on first sign-in (the `cars.user_id` foreign key points at `users.id`).
 */
export interface UserRepository {
  findByAuthId(authUserId: string): Promise<User | null>;
  create(input: { authUserId: string; email: string }): Promise<User>;
}

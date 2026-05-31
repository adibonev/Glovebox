import type { ServiceRecord, Vehicle } from "./domain";

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

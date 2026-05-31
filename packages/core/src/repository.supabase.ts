import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import type { ServiceRecord, User, Vehicle } from "./domain";
import type {
  ServiceRecordRepository,
  UserRepository,
  VehicleRepository,
} from "./repository";

/**
 * Supabase adapters for the repository seam (ARCHITECTURE.md). They implement the
 * SAME VehicleRepository / ServiceRecordRepository interfaces as the in-memory
 * adapters and read from the real database via an injected Supabase client.
 *
 * This file is the ONE place that maps physical tables to domain types:
 *   cars     → Vehicle        (the table stays `cars`; the domain term is Vehicle — ADR-0006)
 *   services → ServiceRecord
 * and the ONE place that translates snake_case columns → camelCase domain fields.
 *
 * Domain ids are strings; the DB primary keys are integers, so ids are stringified
 * here and parsed back when filtering. `userId` is the `users.id` value.
 */

type CarRow = Database["public"]["Tables"]["cars"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

// --- the single snake_case → camelCase mapping seam ------------------------------

function vehicleFromRow(row: Pick<CarRow, "id" | "user_id">): Vehicle {
  return {
    id: String(row.id),
    userId: String(row.user_id),
  };
}

function serviceRecordFromRow(
  row: Pick<ServiceRow, "id" | "car_id" | "service_type" | "expiry_date">,
): ServiceRecord {
  if (row.expiry_date === null) {
    throw new Error(`service ${row.id} has no expiry_date; not a ServiceRecord`);
  }
  return {
    id: String(row.id),
    vehicleId: String(row.car_id),
    serviceType: row.service_type,
    expiryDate: new Date(row.expiry_date),
  };
}

/** Single error-handling policy for the Supabase seam (ARCHITECTURE.md). */
function rowsOrThrow<Row>(
  result: { data: Row[] | null; error: PostgrestError | null },
  context: string,
): Row[] {
  if (result.error) {
    throw new Error(`Supabase ${context} failed: ${result.error.message}`);
  }
  return result.data ?? [];
}

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByUser(userId: string): Promise<Vehicle[]> {
    const result = await this.client
      .from("cars")
      .select("id, user_id")
      .eq("user_id", Number(userId));
    return rowsOrThrow(result, "cars.listByUser").map(vehicleFromRow);
  }
}

export class SupabaseServiceRecordRepository implements ServiceRecordRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByUser(userId: string): Promise<ServiceRecord[]> {
    const result = await this.client
      .from("services")
      .select("id, car_id, service_type, expiry_date")
      .eq("user_id", Number(userId))
      .not("expiry_date", "is", null);
    return rowsOrThrow(result, "services.listByUser").map(serviceRecordFromRow);
  }

  async listByVehicle(vehicleId: string): Promise<ServiceRecord[]> {
    const result = await this.client
      .from("services")
      .select("id, car_id, service_type, expiry_date")
      .eq("car_id", Number(vehicleId))
      .not("expiry_date", "is", null);
    return rowsOrThrow(result, "services.listByVehicle").map(serviceRecordFromRow);
  }
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByAuthId(authUserId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("id, email")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error) {
      throw new Error(`Supabase users.findByAuthId failed: ${error.message}`);
    }
    if (!data) return null;
    return { id: String(data.id), authUserId, email: data.email };
  }

  async create(input: { authUserId: string; email: string }): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert({ auth_user_id: input.authUserId, email: input.email })
      .select("id")
      .single();
    if (error) throw new Error(`Supabase users.create failed: ${error.message}`);
    return { id: String(data.id), authUserId: input.authUserId, email: input.email };
  }
}

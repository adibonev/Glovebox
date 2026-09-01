import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
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
import type {
  DocumentRepository,
  ServiceRecordRepository,
  UserRepository,
  VehicleRepository,
} from "./repository";

type CarUpdate = Database["public"]["Tables"]["cars"]["Update"];
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

/** Postgres `date` columns want a "YYYY-MM-DD" string. */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

// --- the single snake_case → camelCase mapping seam ------------------------------

function vehicleFromRow(
  row: Pick<
    CarRow,
    "id" | "user_id" | "brand" | "model" | "year" | "license_plate" | "vin" | "body_type"
  >,
): Vehicle {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    brand: row.brand,
    model: row.model,
    year: row.year,
    plate: row.license_plate,
    vin: row.vin,
    bodyType: row.body_type,
  };
}

function serviceRecordFromRow(
  row: Pick<ServiceRow, "id" | "car_id" | "service_type" | "expiry_date" | "cost">,
): ServiceRecord {
  if (row.expiry_date === null) {
    throw new Error(`service ${row.id} has no expiry_date; not a ServiceRecord`);
  }
  return {
    id: String(row.id),
    vehicleId: String(row.car_id),
    serviceType: row.service_type,
    expiryDate: new Date(row.expiry_date),
    cost: row.cost,
  };
}

function documentFromRow(
  row: Pick<DocumentRow, "id" | "service_id" | "path" | "name" | "mime_type" | "created_at">,
): Document {
  return {
    id: String(row.id),
    serviceRecordId: String(row.service_id),
    path: row.path,
    name: row.name,
    mimeType: row.mime_type,
    createdAt: row.created_at ? new Date(row.created_at) : null,
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

const CAR_COLUMNS = "id, user_id, brand, model, year, license_plate, vin, body_type";

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByUser(userId: string): Promise<Vehicle[]> {
    const result = await this.client
      .from("cars")
      .select(CAR_COLUMNS)
      .eq("user_id", Number(userId))
      .order("id");
    return rowsOrThrow(result, "cars.listByUser").map(vehicleFromRow);
  }

  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.client
      .from("cars")
      .select(CAR_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(`Supabase cars.getById failed: ${error.message}`);
    return data ? vehicleFromRow(data) : null;
  }

  async create(input: NewVehicle): Promise<Vehicle> {
    const { data, error } = await this.client
      .from("cars")
      .insert({
        user_id: Number(input.userId),
        brand: input.brand,
        model: input.model,
        year: input.year ?? null,
        license_plate: input.plate ?? null,
        vin: input.vin ?? null,
        body_type: input.bodyType ?? null,
      })
      .select(CAR_COLUMNS)
      .single();
    if (error) throw new Error(`Supabase cars.create failed: ${error.message}`);
    return vehicleFromRow(data);
  }

  async update(id: string, changes: VehicleChanges): Promise<Vehicle> {
    const patch: CarUpdate = {};
    if (changes.brand !== undefined) patch.brand = changes.brand;
    if (changes.model !== undefined) patch.model = changes.model;
    if (changes.year !== undefined) patch.year = changes.year;
    if (changes.plate !== undefined) patch.license_plate = changes.plate;
    if (changes.vin !== undefined) patch.vin = changes.vin;
    if (changes.bodyType !== undefined) patch.body_type = changes.bodyType;

    // Ownership is enforced by RLS (a User can only update their own `cars`).
    const { data, error } = await this.client
      .from("cars")
      .update(patch)
      .eq("id", Number(id))
      .select(CAR_COLUMNS)
      .single();
    if (error) throw new Error(`Supabase cars.update failed: ${error.message}`);
    return vehicleFromRow(data);
  }

  async delete(id: string): Promise<void> {
    // Service Records cascade away with the car (FK ON DELETE CASCADE); RLS scopes to owner.
    const { error } = await this.client.from("cars").delete().eq("id", Number(id));
    if (error) throw new Error(`Supabase cars.delete failed: ${error.message}`);
  }
}

const SERVICE_COLUMNS = "id, car_id, service_type, expiry_date, cost";

export class SupabaseServiceRecordRepository implements ServiceRecordRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByUser(userId: string): Promise<ServiceRecord[]> {
    const result = await this.client
      .from("services")
      .select(SERVICE_COLUMNS)
      .eq("user_id", Number(userId))
      .not("expiry_date", "is", null);
    return rowsOrThrow(result, "services.listByUser").map(serviceRecordFromRow);
  }

  async listByVehicle(vehicleId: string): Promise<ServiceRecord[]> {
    const result = await this.client
      .from("services")
      .select(SERVICE_COLUMNS)
      .eq("car_id", Number(vehicleId))
      .not("expiry_date", "is", null);
    return rowsOrThrow(result, "services.listByVehicle").map(serviceRecordFromRow);
  }

  async getById(id: string): Promise<ServiceRecord | null> {
    const { data, error } = await this.client
      .from("services")
      .select(SERVICE_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(`Supabase services.getById failed: ${error.message}`);
    return data && data.expiry_date !== null ? serviceRecordFromRow(data) : null;
  }

  async create(input: NewServiceRecord): Promise<ServiceRecord> {
    const { data, error } = await this.client
      .from("services")
      .insert({
        car_id: Number(input.vehicleId),
        user_id: Number(input.userId),
        service_type: input.serviceType,
        expiry_date: toISODate(input.expiryDate),
        cost: input.cost ?? null,
      })
      .select(SERVICE_COLUMNS)
      .single();
    if (error) throw new Error(`Supabase services.create failed: ${error.message}`);
    return serviceRecordFromRow(data);
  }

  async update(id: string, changes: ServiceRecordChanges): Promise<ServiceRecord> {
    const patch: ServiceUpdate = {};
    if (changes.serviceType !== undefined) patch.service_type = changes.serviceType;
    if (changes.expiryDate !== undefined) patch.expiry_date = toISODate(changes.expiryDate);
    if (changes.cost !== undefined) patch.cost = changes.cost;

    // Ownership is enforced by RLS (update services only for the User's own cars).
    const { data, error } = await this.client
      .from("services")
      .update(patch)
      .eq("id", Number(id))
      .select(SERVICE_COLUMNS)
      .single();
    if (error) throw new Error(`Supabase services.update failed: ${error.message}`);
    return serviceRecordFromRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("services").delete().eq("id", Number(id));
    if (error) throw new Error(`Supabase services.delete failed: ${error.message}`);
  }
}

const DOCUMENT_COLUMNS = "id, service_id, path, name, mime_type, created_at";

export class SupabaseDocumentRepository implements DocumentRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listByUser(userId: string): Promise<Document[]> {
    const result = await this.client
      .from("documents")
      .select(DOCUMENT_COLUMNS)
      .eq("user_id", Number(userId))
      .order("created_at", { ascending: false });
    return rowsOrThrow(result, "documents.listByUser").map(documentFromRow);
  }

  async listByServiceRecord(serviceRecordId: string): Promise<Document[]> {
    const result = await this.client
      .from("documents")
      .select(DOCUMENT_COLUMNS)
      .eq("service_id", Number(serviceRecordId))
      .order("created_at", { ascending: false });
    return rowsOrThrow(result, "documents.listByServiceRecord").map(documentFromRow);
  }

  async create(input: NewDocument): Promise<Document> {
    const { data, error } = await this.client
      .from("documents")
      .insert({
        service_id: Number(input.serviceRecordId),
        user_id: Number(input.userId),
        path: input.path,
        name: input.name,
        mime_type: input.mimeType ?? null,
        size_bytes: input.sizeBytes ?? null,
      })
      .select(DOCUMENT_COLUMNS)
      .single();
    if (error) throw new Error(`Supabase documents.create failed: ${error.message}`);
    return documentFromRow(data);
  }

  async delete(id: string): Promise<void> {
    // Removes the table row only; the Storage object is removed by the caller.
    const { error } = await this.client.from("documents").delete().eq("id", Number(id));
    if (error) throw new Error(`Supabase documents.delete failed: ${error.message}`);
  }
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByAuthId(authUserId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("id, email, is_admin")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error) {
      throw new Error(`Supabase users.findByAuthId failed: ${error.message}`);
    }
    if (!data) return null;
    return { id: String(data.id), authUserId, email: data.email, isAdmin: data.is_admin ?? false };
  }

  async create(input: { authUserId: string; email: string }): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert({ auth_user_id: input.authUserId, email: input.email })
      .select("id")
      .single();
    if (error) throw new Error(`Supabase users.create failed: ${error.message}`);
    // New Users are never Administrators (is_admin defaults to false in the DB).
    return { id: String(data.id), authUserId: input.authUserId, email: input.email, isAdmin: false };
  }

  async findOrCreateByAuthId(input: { authUserId: string; email: string }): Promise<User> {
    const existing = await this.findByAuthId(input.authUserId);
    if (existing) return existing;

    const { data, error } = await this.client
      .from("users")
      .insert({ auth_user_id: input.authUserId, email: input.email })
      .select("id")
      .single();

    if (!error) {
      return { id: String(data.id), authUserId: input.authUserId, email: input.email, isAdmin: false };
    }

    // 23505 = unique_violation. Several screens provision on mount, so on a first run they
    // race each other into this insert; the losers land here and just read what won.
    if (error.code !== "23505") {
      throw new Error(`Supabase users.findOrCreateByAuthId failed: ${error.message}`);
    }
    const raced = await this.findByAuthId(input.authUserId);
    if (raced) return raced;

    // The e-mail is taken by a row this User cannot see — RLS scopes users to their own
    // auth_user_id — so it belongs to an account from before this Auth Identity existed.
    // Linking the two needs the service role and cannot be done from a client.
    throw new Error(
      `Вече съществува профил с този имейл. Влез в него или се свържи с поддръжката.`,
    );
  }
}

import type {
  Document,
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

/** In-memory VehicleRepository for tests (a real seam alongside the Supabase adapter). */
export class InMemoryVehicleRepository implements VehicleRepository {
  private seq = 0;

  constructor(private readonly vehicles: Vehicle[]) {}

  async listByUser(userId: string): Promise<Vehicle[]> {
    return this.vehicles.filter((vehicle) => vehicle.userId === userId);
  }

  async getById(id: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  async create(input: NewVehicle): Promise<Vehicle> {
    const vehicle: Vehicle = {
      id: `mem-v-${++this.seq}`,
      userId: input.userId,
      brand: input.brand,
      model: input.model,
      year: input.year ?? null,
      plate: input.plate ?? null,
      bodyType: input.bodyType ?? null,
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async update(id: string, changes: VehicleChanges): Promise<Vehicle> {
    const vehicle = this.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new Error(`Vehicle ${id} not found`);
    if (changes.brand !== undefined) vehicle.brand = changes.brand;
    if (changes.model !== undefined) vehicle.model = changes.model;
    if (changes.year !== undefined) vehicle.year = changes.year;
    if (changes.plate !== undefined) vehicle.plate = changes.plate;
    if (changes.bodyType !== undefined) vehicle.bodyType = changes.bodyType;
    return vehicle;
  }

  async delete(id: string): Promise<void> {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index >= 0) this.vehicles.splice(index, 1);
  }
}

/** In-memory ServiceRecordRepository for tests; joins records → Vehicles by owner. */
export class InMemoryServiceRecordRepository implements ServiceRecordRepository {
  private seq = 0;

  constructor(
    private readonly vehicles: Vehicle[],
    private readonly serviceRecords: ServiceRecord[],
  ) {}

  async listByVehicle(vehicleId: string): Promise<ServiceRecord[]> {
    return this.serviceRecords.filter((record) => record.vehicleId === vehicleId);
  }

  async listByUser(userId: string): Promise<ServiceRecord[]> {
    const ownedVehicleIds = new Set(
      this.vehicles
        .filter((vehicle) => vehicle.userId === userId)
        .map((vehicle) => vehicle.id),
    );
    return this.serviceRecords.filter((record) =>
      ownedVehicleIds.has(record.vehicleId),
    );
  }

  async getById(id: string): Promise<ServiceRecord | null> {
    return this.serviceRecords.find((record) => record.id === id) ?? null;
  }

  async create(input: NewServiceRecord): Promise<ServiceRecord> {
    // The denormalised owner (input.userId) lives only in the store; the domain
    // ServiceRecord doesn't carry it.
    const record: ServiceRecord = {
      id: `mem-s-${++this.seq}`,
      vehicleId: input.vehicleId,
      serviceType: input.serviceType,
      expiryDate: input.expiryDate,
    };
    this.serviceRecords.push(record);
    return record;
  }

  async update(id: string, changes: ServiceRecordChanges): Promise<ServiceRecord> {
    const record = this.serviceRecords.find((r) => r.id === id);
    if (!record) throw new Error(`ServiceRecord ${id} not found`);
    if (changes.serviceType !== undefined) record.serviceType = changes.serviceType;
    if (changes.expiryDate !== undefined) record.expiryDate = changes.expiryDate;
    return record;
  }

  async delete(id: string): Promise<void> {
    const index = this.serviceRecords.findIndex((r) => r.id === id);
    if (index >= 0) this.serviceRecords.splice(index, 1);
  }
}

/** In-memory DocumentRepository for tests; joins Documents → Service Records → Vehicles by owner. */
export class InMemoryDocumentRepository implements DocumentRepository {
  constructor(
    private readonly vehicles: Vehicle[],
    private readonly serviceRecords: ServiceRecord[],
    private readonly documents: Document[],
  ) {}

  async listByUser(userId: string): Promise<Document[]> {
    const ownedVehicleIds = new Set(
      this.vehicles.filter((vehicle) => vehicle.userId === userId).map((vehicle) => vehicle.id),
    );
    const ownedServiceIds = new Set(
      this.serviceRecords
        .filter((record) => ownedVehicleIds.has(record.vehicleId))
        .map((record) => record.id),
    );
    return this.documents.filter((doc) => ownedServiceIds.has(doc.serviceRecordId));
  }
}

/** In-memory UserRepository for tests. */
export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: User[] = []) {}

  async findByAuthId(authUserId: string): Promise<User | null> {
    return this.users.find((user) => user.authUserId === authUserId) ?? null;
  }

  async create(input: { authUserId: string; email: string }): Promise<User> {
    const user: User = {
      id: String(this.users.length + 1),
      authUserId: input.authUserId,
      email: input.email,
    };
    this.users.push(user);
    return user;
  }
}

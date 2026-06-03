import type { Document, ServiceRecord, User, Vehicle } from "./domain";
import type {
  DocumentRepository,
  ServiceRecordRepository,
  UserRepository,
  VehicleRepository,
} from "./repository";

/** In-memory VehicleRepository for tests (a real seam alongside the Supabase adapter). */
export class InMemoryVehicleRepository implements VehicleRepository {
  constructor(private readonly vehicles: Vehicle[]) {}

  async listByUser(userId: string): Promise<Vehicle[]> {
    return this.vehicles.filter((vehicle) => vehicle.userId === userId);
  }
}

/** In-memory ServiceRecordRepository for tests; joins records → Vehicles by owner. */
export class InMemoryServiceRecordRepository implements ServiceRecordRepository {
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

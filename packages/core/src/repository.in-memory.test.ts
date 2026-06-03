import { describe, expect, it } from "vitest";

import type { Document, ServiceRecord, Vehicle } from "./domain";
import {
  InMemoryDocumentRepository,
  InMemoryServiceRecordRepository,
  InMemoryUserRepository,
  InMemoryVehicleRepository,
} from "./repository.in-memory";

const vehicles: Vehicle[] = [
  { id: "car-1", userId: "user-1", brand: "BMW", model: "320d", year: 2019, plate: "CB1234AB", bodyType: "sedan" },
  { id: "car-2", userId: "user-2", brand: "Audi", model: "A4", year: 2020, plate: null, bodyType: null },
];

const serviceRecords: ServiceRecord[] = [
  {
    id: "rec-1",
    vehicleId: "car-1",
    serviceType: "civil_liability",
    expiryDate: new Date("2026-06-15"),
  },
  {
    id: "rec-2",
    vehicleId: "car-2",
    serviceType: "vignette",
    expiryDate: new Date("2026-06-11"),
  },
];

describe("InMemoryVehicleRepository", () => {
  it("lists the Vehicles owned by a given User", async () => {
    const repo = new InMemoryVehicleRepository(vehicles);

    const owned = await repo.listByUser("user-1");

    expect(owned.map((v) => v.id)).toEqual(["car-1"]);
  });
});

describe("InMemoryServiceRecordRepository", () => {
  it("lists the Service Records belonging to a given User across their Vehicles", async () => {
    const repo = new InMemoryServiceRecordRepository(vehicles, serviceRecords);

    const records = await repo.listByUser("user-1");

    expect(records.map((r) => r.id)).toEqual(["rec-1"]);
  });
});

describe("InMemoryDocumentRepository", () => {
  it("lists the Documents belonging to a given User across their Service Records", async () => {
    const documents: Document[] = [
      { id: "doc-1", serviceRecordId: "rec-1", path: "u1/rec-1/a.pdf", name: "a.pdf", mimeType: "application/pdf", createdAt: null },
      { id: "doc-2", serviceRecordId: "rec-2", path: "u2/rec-2/b.pdf", name: "b.pdf", mimeType: "application/pdf", createdAt: null },
    ];
    const repo = new InMemoryDocumentRepository(vehicles, serviceRecords, documents);

    const owned = await repo.listByUser("user-1");

    expect(owned.map((d) => d.id)).toEqual(["doc-1"]);
  });
});

describe("InMemoryUserRepository", () => {
  it("creates a User and finds it by Auth Identity", async () => {
    const repo = new InMemoryUserRepository();

    expect(await repo.findByAuthId("auth-1")).toBeNull();

    const created = await repo.create({ authUserId: "auth-1", email: "a@b.bg" });
    expect(created).toMatchObject({ authUserId: "auth-1", email: "a@b.bg" });
    expect(await repo.findByAuthId("auth-1")).toEqual(created);
  });
});

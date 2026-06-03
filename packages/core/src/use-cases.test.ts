import { describe, expect, it } from "vitest";

import type { ServiceRecord, Vehicle } from "./domain";
import { InMemoryServiceRecordRepository } from "./repository.in-memory";
import { dueRemindersForUser } from "./use-cases";

describe("dueRemindersForUser", () => {
  it("loads a User's Service Records via the repository and returns the due Reminders", async () => {
    const vehicles: Vehicle[] = [
      { id: "car-1", userId: "user-1", brand: "BMW", model: "320d", year: 2019, plate: "CB1234AB", bodyType: "sedan" },
      // another User's Vehicle — must be ignored
      { id: "car-2", userId: "user-2", brand: "Audi", model: "A4", year: 2020, plate: null, bodyType: null },
    ];
    const serviceRecords: ServiceRecord[] = [
      // user-1, due: 14 days out, window 30
      { id: "go-due", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-06-15") },
      // user-1, not due: 60 days out, window 30
      { id: "go-far", vehicleId: "car-1", serviceType: "civil_liability", expiryDate: new Date("2026-07-31") },
      // user-2, within window but belongs to another User — must be ignored
      { id: "other-due", vehicleId: "car-2", serviceType: "civil_liability", expiryDate: new Date("2026-06-10") },
    ];
    const repository = new InMemoryServiceRecordRepository(vehicles, serviceRecords);
    const windows = { civil_liability: 30 };

    const due = await dueRemindersForUser(
      repository,
      "user-1",
      windows,
      new Date("2026-06-01"),
    );

    expect(due.map((r) => r.serviceRecordId)).toEqual(["go-due"]);
  });
});

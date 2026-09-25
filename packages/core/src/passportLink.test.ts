import { describe, expect, it } from "vitest";

import { InMemoryPassportLinkRepository } from "./repository.in-memory";

describe("InMemoryPassportLinkRepository", () => {
  it("opens a Vehicle's passport by the token of its Passport Link", async () => {
    const repo = new InMemoryPassportLinkRepository();

    const link = await repo.create({ vehicleId: "car-1", userId: "user-1", includeCosts: false });

    expect(link.token.length).toBeGreaterThanOrEqual(32);
    expect(await repo.findActiveByToken(link.token)).toMatchObject({ vehicleId: "car-1", includeCosts: false });
    expect(await repo.activeForVehicle("car-1")).toMatchObject({ id: link.id });
  });

  it("stops opening anything once the owner revokes the Passport Link", async () => {
    const repo = new InMemoryPassportLinkRepository();
    const link = await repo.create({ vehicleId: "car-1", userId: "user-1", includeCosts: true });

    await repo.revoke(link.id);

    expect(await repo.findActiveByToken(link.token)).toBeNull();
    expect(await repo.activeForVehicle("car-1")).toBeNull();
  });
});

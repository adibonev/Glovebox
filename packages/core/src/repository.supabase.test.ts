import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "./database.types";
import {
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
} from "./repository.supabase";

const url = process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const hasEnv = url !== "" && serviceRoleKey !== "";

// Integration test against the real dev database. It seeds its own User + Vehicle +
// Service Record, reads them back through the adapters, then cleans up. Skipped unless
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set — the service-role key bypasses RLS
// so the test can write/read/delete. Put them in a git-ignored packages/core/.env to run.
describe.skipIf(!hasEnv)("Supabase repositories (integration)", () => {
  let admin: SupabaseClient<Database>;
  let userId = 0;
  let carId = 0;
  let serviceId = 0;

  beforeAll(async () => {
    admin = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: user, error: userErr } = await admin
      .from("users")
      .insert({ email: `it-${Date.now()}@glovebox.test`, name: "Integration Test" })
      .select("id")
      .single();
    if (userErr) throw new Error(`seed user: ${userErr.message}`);
    userId = user.id;

    const { data: car, error: carErr } = await admin
      .from("cars")
      .insert({ user_id: userId, brand: "Toyota", model: "Corolla" })
      .select("id")
      .single();
    if (carErr) throw new Error(`seed car: ${carErr.message}`);
    carId = car.id;

    const { data: service, error: svcErr } = await admin
      .from("services")
      .insert({
        car_id: carId,
        user_id: userId,
        service_type: "civil_liability",
        expiry_date: "2026-06-15",
      })
      .select("id")
      .single();
    if (svcErr) throw new Error(`seed service: ${svcErr.message}`);
    serviceId = service.id;
  });

  afterAll(async () => {
    // ON DELETE CASCADE (users → cars → services) removes the whole test graph.
    if (userId) await admin.from("users").delete().eq("id", userId);
  });

  it("SupabaseVehicleRepository.listByUser maps cars → Vehicle", async () => {
    const vehicles = await new SupabaseVehicleRepository(admin).listByUser(
      String(userId),
    );
    expect(vehicles).toContainEqual({ id: String(carId), userId: String(userId) });
  });

  it("SupabaseServiceRecordRepository.listByUser maps services → ServiceRecord", async () => {
    const records = await new SupabaseServiceRecordRepository(admin).listByUser(
      String(userId),
    );
    expect(records).toContainEqual({
      id: String(serviceId),
      vehicleId: String(carId),
      serviceType: "civil_liability",
      expiryDate: new Date("2026-06-15"),
    });
  });
});

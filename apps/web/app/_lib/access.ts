import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The owner (users.id) of a car this User may write to: their own, or one shared with them
 * (Vehicle Member). Null for any other car.
 *
 * Checked here rather than left to RLS: an Administrator's policies can read and delete every
 * row, so a bare lookup would let a crafted id reach someone else's car. Rows written on a shared
 * car carry the owner's id, which is why the owner is what this returns.
 */
export async function writableCarOwner(
  supabase: ServerClient,
  userId: number,
  carId: number,
): Promise<number | null> {
  const { data: car } = await supabase.from("cars").select("user_id").eq("id", carId).maybeSingle();
  if (!car) return null;
  if (car.user_id === userId) return car.user_id;

  // Missing until the sharing migration is applied; then only one's own car is writable.
  const { data: member, error } = await supabase
    .from("vehicle_members")
    .select("car_id")
    .eq("car_id", carId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && member ? car.user_id : null;
}

/** The same, reached from a Service Record: its car's owner, if this User may write to it. */
export async function writableServiceOwner(
  supabase: ServerClient,
  userId: number,
  serviceId: number,
): Promise<number | null> {
  const { data: service } = await supabase.from("services").select("car_id").eq("id", serviceId).maybeSingle();
  return service ? writableCarOwner(supabase, userId, service.car_id) : null;
}

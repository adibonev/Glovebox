/**
 * Shared Vehicles — a car followed by more than one person (Vehicle Member, UBIQUITOUS_LANGUAGE.md).
 *
 * The owner sends a one-time link; whoever opens it signed in becomes a member: they see and edit
 * the car's records and get its Reminders. Only the owner deletes the car, shares it or makes its
 * passport. The rules themselves live in the database (the sharing migration); this is the seam.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import type { Vehicle } from "./domain";

/** A person on a car, for the owner's list and the member's "shared by" line. */
export interface VehiclePerson {
  userId: string;
  email: string;
  name: string | null;
  isOwner: boolean;
}

/** The link an owner sends; it works once, for seven days. */
export function shareLink(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/s/${token}`;
}

/** A Vehicle someone else owns and shared with this User. */
export function isSharedWithMe(vehicle: Vehicle, userId: string): boolean {
  return vehicle.userId !== userId;
}

export interface VehicleSharingRepository {
  /** A fresh one-time invitation to the Vehicle; its token goes in the link. Owner only. */
  invite(vehicleId: string, ownerId: string): Promise<string>;
  /** Accept an invitation for the signed-in User: the Vehicle's id, or null when it no longer works. */
  join(token: string): Promise<string | null>;
  /** The owner first, then the members. For the owner and members only. */
  people(vehicleId: string): Promise<VehiclePerson[]>;
  /** The owner removing a member, or a member leaving (with their own id). */
  remove(vehicleId: string, userId: string): Promise<void>;
}

export class SupabaseVehicleSharingRepository implements VehicleSharingRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async invite(vehicleId: string, ownerId: string): Promise<string> {
    const { data, error } = await this.client
      .from("vehicle_invites")
      .insert({ car_id: Number(vehicleId), created_by: Number(ownerId) })
      .select("token")
      .single();
    if (error) throw new Error(`Supabase vehicle_invites.create failed: ${error.message}`);
    return data.token;
  }

  async join(token: string): Promise<string | null> {
    const { data, error } = await this.client.rpc("join_vehicle", { invite: token });
    if (error) throw new Error(`Supabase join_vehicle failed: ${error.message}`);
    return data == null ? null : String(data);
  }

  async people(vehicleId: string): Promise<VehiclePerson[]> {
    const { data, error } = await this.client.rpc("vehicle_people", { car: Number(vehicleId) });
    if (error) throw new Error(`Supabase vehicle_people failed: ${error.message}`);
    return (data ?? []).map((row) => ({
      userId: String(row.user_id),
      email: row.email,
      name: row.name,
      isOwner: row.is_owner,
    }));
  }

  async remove(vehicleId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("vehicle_members")
      .delete()
      .eq("car_id", Number(vehicleId))
      .eq("user_id", Number(userId));
    if (error) throw new Error(`Supabase vehicle_members.delete failed: ${error.message}`);
  }
}

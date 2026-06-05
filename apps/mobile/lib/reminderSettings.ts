import type { ReminderWindows } from "@glovebox/core";

import { supabase } from "./supabase";

/** Default Reminder Window per Service Type (days), used when the User hasn't set one. */
export const DEFAULT_WINDOWS: ReminderWindows = {
  civil_liability: 30,
  casco: 30,
  vignette: 14,
  inspection: 30,
  tax: 30,
  fire_extinguisher: 30,
  maintenance: 30,
};

/** The Reminder Window choices a User can pick (days before Expiry Date). */
export const WINDOW_OPTIONS = [7, 14, 30, 60, 90] as const;

/** Fallback when a Service Type has no window (e.g. a brand-new type). */
export const DEFAULT_WINDOW = 30;

export type ReminderConfig = { windows: ReminderWindows; enabled: boolean };

/** Merge a stored `reminder_settings` JSON over the defaults into a full ReminderWindows. */
export function parseWindows(raw: unknown): ReminderWindows {
  const windows: ReminderWindows = { ...DEFAULT_WINDOWS };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [serviceType, value] of Object.entries(raw as Record<string, unknown>)) {
      const days = Number(value);
      if (Number.isFinite(days) && days > 0) windows[serviceType] = days;
    }
  }
  return windows;
}

/** Read the User's Reminder configuration (RLS scopes the row to the owner). */
export async function loadReminderConfig(userId: string): Promise<ReminderConfig> {
  const { data } = await supabase
    .from("users")
    .select("reminder_settings, reminder_enabled")
    .eq("id", Number(userId))
    .maybeSingle();
  return {
    windows: parseWindows(data?.reminder_settings),
    enabled: data?.reminder_enabled ?? true,
  };
}

/** Persist the User's Reminder Windows + email toggle. */
export async function saveReminderConfig(userId: string, config: ReminderConfig): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ reminder_settings: config.windows, reminder_enabled: config.enabled })
    .eq("id", Number(userId));
  if (error) throw new Error(error.message);
}

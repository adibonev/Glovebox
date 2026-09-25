import { ExtensionStorage } from "@bacons/apple-targets";
import type { ServiceRecord, Vehicle } from "@glovebox/core";
import { Platform } from "react-native";

import { SERVICE_TYPE_LABELS } from "./labels";

/** Shared with the widget extension (targets/widget); both sides must name the same group. */
const APP_GROUP = "group.bg.glovebox.app";
const KEY = "deadlines";

/**
 * Words short enough for the round lock-screen widget. Not the two-letter codes the app uses in
 * chips: "КС" or "ДН" mean nothing on a lock screen, "Каско" and "Данък" do.
 */
const WIDGET_SHORT: Record<string, string> = {
  civil_liability: "ГО",
  casco: "Каско",
  vignette: "Винетка",
  inspection: "ГТП",
  tax: "Данък",
  fire_extinguisher: "Гасител",
  maintenance: "Сервиз",
};

/** One obligation as the widget reads it. Mirrors `Deadline` in targets/widget. */
type WidgetDeadline = {
  id: string;
  label: string;
  short: string;
  vehicle: string;
  /** "YYYY-MM-DD". The widget counts the days itself, so it stays right with the app closed. */
  expiry: string;
  window: number;
};

const storage = Platform.OS === "ios" ? new ExtensionStorage(APP_GROUP) : null;

/**
 * Hand the widget the most urgent obligations, overdue first then soonest. Called whenever the
 * garage loads, which covers a renewal, a new car and a new day. A no-op off iOS and in builds
 * without the widget's native module.
 */
export function publishDeadlines(
  items: readonly { record: ServiceRecord; vehicle: Vehicle; days: number }[],
  windowFor: (serviceType: string) => number,
): void {
  if (!storage) return;
  const deadlines: WidgetDeadline[] = [...items]
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)
    .map(({ record, vehicle }) => ({
      id: record.id,
      label: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
      short: WIDGET_SHORT[record.serviceType] ?? record.serviceType,
      vehicle: `${vehicle.brand} ${vehicle.model}`,
      expiry: record.expiryDate.toISOString().slice(0, 10),
      window: windowFor(record.serviceType),
    }));
  try {
    storage.set(KEY, JSON.stringify({ items: deadlines }));
    ExtensionStorage.reloadWidget();
  } catch {
    // The widget is a convenience; never let it break loading the garage.
  }
}

/** Empty the widget on sign-out: the next person to pick up the phone sees no one's deadlines. */
export function clearDeadlines(): void {
  if (!storage) return;
  try {
    storage.remove(KEY);
    ExtensionStorage.reloadWidget();
  } catch {
    // Nothing to clear, or no widget in this build.
  }
}

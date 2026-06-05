/**
 * Subscription & billing domain (UBIQUITOUS_LANGUAGE.md, ADR-0003).
 *
 * Pure, no I/O. This is the single source of truth for feature gating: the active
 * Plan is resolved server-side (Stripe / RevenueCat webhooks → Supabase) and clients
 * read the resulting Entitlements / Quotas through these helpers — never a raw plan
 * or price string.
 */

/**
 * Master switch for monetization. While `false` the product is **fully free**: the Plan
 * resolvers hand back an unlimited Plan (so no Quota or Paywall can ever trigger) and the apps
 * hide every upgrade / pricing surface. Flip to `true` — and wire live Stripe / RevenueCat keys —
 * to turn billing on. Pure functions below stay plan-based (unchanged) so the switch is the only
 * thing to move. Kept here in `core` as the single source of truth (web + mobile both read it).
 */
// Typed as `boolean` (not the literal `false`) so call sites read it as a real runtime flag —
// no "condition always false" / unreachable-code analysis, and flipping it is a one-char change.
export const BILLING_ENABLED: boolean = false;

export type Plan = "free" | "pro" | "legacy";

/** A concrete capability unlocked by the active Plan. */
export type Entitlement =
  | "unlimited_vehicles"
  | "unlimited_documents"
  | "push_notifications"
  | "custom_reminder_windows"
  | "pdf_export"
  | "family_sharing";

export type BillingPeriod = "monthly" | "annual";
export type BillingChannel = "web" | "app_store" | "play_store";

/** An active paid commitment that grants the Pro Plan for a Billing Period. */
export interface Subscription {
  plan: "pro";
  billingPeriod: BillingPeriod;
  billingChannel: BillingChannel;
  /** ISO date the current period ends; gating treats the User as Pro until then. */
  currentPeriodEnd: string;
  /** A 14-day Trial counts as Pro while active. */
  trial: boolean;
}

// Pro and Legacy share the full capability set; Legacy is the grandfathered tier that
// keeps it forever for pre-billing Users.
const PRO_ENTITLEMENTS: readonly Entitlement[] = [
  "unlimited_vehicles",
  "unlimited_documents",
  "push_notifications",
  "custom_reminder_windows",
  "pdf_export",
  "family_sharing",
];

const PLAN_ENTITLEMENTS: Record<Plan, readonly Entitlement[]> = {
  free: ["pdf_export"],
  pro: PRO_ENTITLEMENTS,
  legacy: PRO_ENTITLEMENTS,
};

/** The Entitlements granted by a Plan. */
export function entitlementsFor(plan: Plan): Entitlement[] {
  return [...PLAN_ENTITLEMENTS[plan]];
}

/** Whether a Plan grants a given Entitlement (the one gating check clients should use). */
export function hasEntitlement(plan: Plan, entitlement: Entitlement): boolean {
  return PLAN_ENTITLEMENTS[plan].includes(entitlement);
}

/** Numeric caps a Plan imposes; `null` means unlimited. */
export interface Quota {
  vehicles: number | null;
  servicesPerVehicle: number | null;
  documentsPerServiceRecord: number | null;
}

const PLAN_QUOTAS: Record<Plan, Quota> = {
  // Free: one Vehicle with up to two Service Records on it; Documents are unlimited. The
  // Paywall appears on a second Vehicle or a third Service Record.
  free: { vehicles: 1, servicesPerVehicle: 2, documentsPerServiceRecord: null },
  pro: { vehicles: null, servicesPerVehicle: null, documentsPerServiceRecord: null },
  legacy: { vehicles: null, servicesPerVehicle: null, documentsPerServiceRecord: null },
};

/** The Quotas a Plan imposes. */
export function quotaFor(plan: Plan): Quota {
  return PLAN_QUOTAS[plan];
}

/** Whether a User on `plan` may add another Vehicle, given how many they already own. */
export function canAddVehicle(plan: Plan, currentVehicleCount: number): boolean {
  const cap = PLAN_QUOTAS[plan].vehicles;
  return cap === null || currentVehicleCount < cap;
}

/** Whether a User may add another Service Record to a Vehicle that already has some. */
export function canAddService(plan: Plan, currentServiceCount: number): boolean {
  const cap = PLAN_QUOTAS[plan].servicesPerVehicle;
  return cap === null || currentServiceCount < cap;
}

/** Whether a User may attach another Document to a Service Record that already has some. */
export function canAddDocument(plan: Plan, currentDocumentCount: number): boolean {
  const cap = PLAN_QUOTAS[plan].documentsPerServiceRecord;
  return cap === null || currentDocumentCount < cap;
}

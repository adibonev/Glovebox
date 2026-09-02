/**
 * @glovebox/core — domain logic, repositories, types and validation.
 * The single source of truth for behaviour (ADR-0001).
 *
 * Public API surface: domain types, the Reminder module, and repository seams.
 */

export const CORE_PACKAGE_NAME = "@glovebox/core" as const;

export * from "./account";
export * from "./account.supabase";
export * from "./analysis";
export * from "./billing";
export * from "./domain";
export * from "./registryCheck";
export * from "./reminder";
export * from "./signIn";
export * from "./repository";
export * from "./repository.in-memory";
export * from "./repository.supabase";
export * from "./use-cases";
export type { Database } from "./database.types";

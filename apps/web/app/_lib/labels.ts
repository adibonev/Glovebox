import type { ExpiryStatus } from "@glovebox/core";
import { statusColors } from "@glovebox/ui";

// The words and formats live in core (@glovebox/core/labels), shared with the phone app, so the
// two never word the same thing differently. What is only the website's stays below.
export {
  AUTH_ERROR_MESSAGES,
  SERVICE_TYPE_CODES,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ORDER,
  STATUS_LABELS,
  authErrorMessage,
  formatCost,
  formatCostCompact,
  formatDate,
  formatDateShort,
  formatDaysFigure,
  formatDaysRemaining,
  formatRecordLabel,
  formatRecordSummary,
  parseCost,
} from "@glovebox/core/labels";

/** Functional status colors from the shared design tokens. */
export const STATUS_COLORS: Record<ExpiryStatus, string> = {
  Valid: statusColors.valid,
  ExpiringSoon: statusColors.expiring,
  Expired: statusColors.expired,
};

/**
 * What a User must type to confirm an irreversible account deletion. Lives here, not in
 * actions.ts: a "use server" file may only export async functions, so a plain const there
 * fails the production build (typecheck and lint do not catch it).
 */
export const DELETE_ACCOUNT_CONFIRMATION = "ИЗТРИЙ";

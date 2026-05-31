# ADR-0006 — Domain term "Vehicle", keep the `cars` table

**Status:** Accepted

**Context.** Legacy table is `cars`; brand was CarGuard. "Vehicle" is the better, future-proof
domain term. But real users exist, so a live table rename is risky for no user value.

**Decision.** Canonical domain term is **Vehicle** (code, types, UI copy). The **physical DB
table stays `cars`**; map to `Vehicle` at the `packages/core` edge. Do not rename the table.
The product brand is **Glovebox** (ADR-0008) — independent of the table name.

**Consequences.** Clean domain language without a risky migration. One mapping seam in `core`.
